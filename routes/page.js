const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const util = require('util');
const googleMaps = require('@google/maps');

const {Post,User,Reply,Like,Placetag} = require('../models');

const router = express.Router();
const googleMapsClient = googleMaps.createClient({
  key: process.env.PLACES_API_KEY,
});
//프로필 수정
router.get('/profile/:id', isLoggedIn ,async(req, res, next) => {
  try{
    let userid = req.params.id;
    const userinfo = await User.find({where:{id:userid}});
    res.render('join', { 
      title: 'Join - TravelerHotSpot', 
      user: req.user,
      userinfo: userinfo,
    });
  }catch(error){
    console.error(error);
    next(error);
  }
});
//회원가입
router.get('/join', isNotLoggedIn ,(req, res) => {
  res.render('join', {
    title: '회원가입 - NodeBird',
    user: req.user,
    joinError: req.flash('joinError'),
  });
});
//메인화면
router.get('/', async(req, res, next) => {
  try{
    let placepost = await Post.find({});
    if(placepost === null){
      placepost = [];
    }

    let listplace = await Post.findAll({order:[['like','DESC']]});
    // console.log('리스트: ',typeof(listplace),listplace.length);
    // console.log('위치: ',typeof(placepost));
    // console.log('req.user에 대해: ',req.user, typeof(req.user));
    res.render('map', {
      title:'TravelHotSpot',
      user: req.user,
      loginError: req.flash('loginError'),
      results: placepost,
      showPlaces: listplace,
      cancel: req.flash('cancel'),
      authcancel:req.flash('autherror'),
    });

    // Post.findAll({})
    //   .then((posts)=>{
    //     console.log('결과값이 배열일까?:',typeof(posts),posts); //object로... 결과가 같다.
    //     res.render('map',{
    //       title:'TravelHotSpot',
    //       user: req.user,
    //       loginError: req.flash('loginError'),
    //       results: posts,
    //       showPlaces: posts,
    //     });
    //   });
  }catch(error){
    console.error(error);
    next(error);
  }
});
//등록된 장소만 찾기
router.get('/searchplace',async(req,res,next)=>{
  const query = req.query.placename;
  if(!query){
    return res.redirect('/');
  }
  try{
    let placepost = await Post.find({});
    if(placepost === null){
      placepost = [];
    }
    const name = await Placetag.find({where:{title:query}});
    let posts=[];
    if(name){
      posts = await name.getPosts({order:[['like','DESC']]});
    }
    return res.render('map',{
      title:'TravelHotSpot',
      user: req.user,
      loginError: req.flash('loginError'),
      results: placepost,
      showPlaces: posts,
      cancel: req.flash('cancel'),
      authcancel:req.flash('autherror'),
    });
  }catch(err){
    console.error(err);
    next(err);
  }
});

//장소 검색 자동으로 검색어 완성
router.get('/autocomplete/:query', (req, res, next) => { 
  console.log('작동되나?');
  googleMapsClient.placesQueryAutoComplete({  //'강'을 입력하면 강북,강남,강동,강서 등을 추천해준다.
    input: req.params.query,        //라우터로 전달된 쿼리를 input으로 넣어주면 된다.
    language: 'ko',             //한국어 결과값을 얻는다.
  }, (err, response) => {   //https://developers.google.com/places/web-service/query (참조하자)
    if (err) {
      return next(err);
    }
    return res.json(response.json.predictions); //콜백 방식으로 동작하고, 결과는 response.json.predictions에
  });               //담겨 있다. 예상 검색어는 최대 다섯개까지 리턴된다. (리턴값 구조는 위의 참조부분에 나온다.)
});

//장소 검색 라우터
router.get('/search/:query', async (req, res, next) => {
  const googlePlaces = util.promisify(googleMapsClient.places); //places()메서드로 장소를 검색한다.
  const googlePlacesNearby = util.promisify(googleMapsClient.placesNearby); //placesNearby()메서드로 주변검색
  //구글api는 리턴을 콜백으로 해주기 때문에 promise 방식으로 바꿔준다.(async / await를 사용하기 위해)

  const {lat,lng,type} = req.query;//views/layout.pug에서 location.href로 URL값 설정후 쿼리값을 가져온다

  try {
    let finduserid = await User.find({where:{nick:req.user.nick}});
    let postplace = await Post.find({where:{userId:finduserid.id, content: null, name:req.params.query}});
    let sameplace = await Post.findAll({where:{userId:finduserid.id, content:null, name:req.params.query}});
    //console.log('과연...',typeof(sameplace),sameplace.length);
    //if(postplace === null){console.log('암것도 안뜨네~');}
    if(sameplace.length >= 2){postplace = null;}else if(sameplace.length <= 1){sameplace = null;}
    let response;
    if(lat && lng){
      response = await googlePlacesNearby({   //쿼리스트링으로 lat,lng을 가져왔다.
        keyword: req.params.query,//keyword: 찾을 검색어
        location: `${lat},${lng}`,//location: 위도와 경도
        rankby: 'distance',//rankby: 정렬순서
        language: 'ko',//language: 검색언어 설정
        type, //type변수 추가
        //radius: 5000,//radius: 검색반경 
        //(rankby 대신 radius(반경,미터단위)를 입력하면 현재장소에서 반경 내 장소들을 인기순으로 검색한다)
      });
    }else{
      response = await googlePlaces({
        query: req.params.query,          //검색어를 넣고
        language: 'ko',                   //한국어 설정을 한다.
        type,
      }); 
    }
    res.render('result', {
      title: `${req.params.query} 검색 결과`,
      results: response.json.results,   //결과는 response.json.results에 담겨있다. (배열 형태로 들어간다.)
      query: req.params.query,  //https://developers.google.com/places/web-service/search  (참조) 
      user: req.user,
      writepost: postplace,
      errorplace: sameplace,
    });  //위의 주소에서 여기서 Nearby Search and Text Search responses 로 검색하면 리턴해주는 데이터구조가 나온다
  } catch (error) {
    console.error(error);
    next(error);
  }
});

//장소정보1 서버에 저장((문제점은 같은 아디로 여러개 만들경우 다 같이 바뀜))
router.post('/location/:id/addplace', async(req,res,next)=>{
  try{
    const finduserid = await User.find({where:{nick:req.user.nick}});
    const addplace = await Post.create({
      placeId:req.params.id,
      name: req.body.name,
      lng: req.body.lat,
      lat: req.body.lat,
      userId: finduserid.id,
    });
    const name = await Placetag.findOrCreate({where:{title:req.body.name}});
    //onsole.log('이건??',addplace.id,'장소이름',name);
    await addplace.addPlacetag(name[0]);//여기서 삽질엄청함 sql문을 2개 날린다 첫번째것(value값)을 선택하기 위한
    //console.log('나오나?');             //[0] 이다... 여러값을 받고 싶다면 addPlacetags s를 붙인다 
    res.send(addplace);                 // 배열값으로 들어가기 때문에 이에 맞게 placetag에 title이 만들어지고
  }catch(error){                        //다중연결이 될 것이다
    console.error(error);
    next(error);
  }
});
//장소 게시글 내용보기
router.get('/reply/:query/:id', async(req,res,next)=>{
  try{
    console.log('params!!:',req.params.query,'ID:::',req.params.id);
    //reply/${showPlace.name}/${showPlace.userId} 
    const replyContent = await Post.find({
      where:{name:req.params.query,userId:req.params.id}
    });
    // //이미지 리사이즈 불러오기
    // const replypic = gm(replyContent.img).resize(150,150,'^');

    const reply = await Reply.findAll({
      where:{postId:replyContent.id},
      order:[['createdAt','DESC']],
      include: {
        model:User,
        attributes: ['id', 'nick'],
      },
    });
    console.log('reply콘솔:',reply);
    let listplace = await Post.findAll({order:[['like','DESC']]});
    const writer = await User.find({where:{id:replyContent.userId}});
    let likecount = await Like.findAll({where:{postId:replyContent.id}});
    console.log('라이크카운트',likecount.length,typeof(likecount),likecount);
    // let test = likecount.like
    if(likecount === null){
      likecount = [];
    }
    res.render('reply',{
      title:'TravelHotSpot',
      user: req.user,
      loginError: req.flash('loginError'),
      replys: reply,
      showPlaces: listplace,
      replycontent: replyContent,
      replywriter: writer,
      likecount: likecount.length,
    });
  }catch(error){
    console.error(error);
    next(error);
  }
});
//장소 게시글 수정
router.get('/replyupdate/:id', async(req,res,next) => {
  try{
    let listplace = await Post.findAll({order:[['like','DESC']]});
    const replyContent = await Post.find({
      where:{id:req.params.id},
      include:{
        model:User,
        attributes:['id','nick'],
      },
    });
    // console.log("유저가 어찌 나오는지 보자",replyContent);
    res.render('replyUpdate',{
      title:'TravelHotSpot',
      user: req.user,
      loginError: req.flash('loginError'),
      showPlaces: listplace,
      replycontent: replyContent,
    });
  }catch(error){
    console.error(error);
    next(error);
  }
});


module.exports = router;
