const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {Post,User,Reply,Like} = require('../models');
const { isLoggedIn } = require('./middlewares');
const {cleanfiles} = require('./cleanfile');

const router = express.Router();

fs.readdir('uploads', (error,filelist)=>{
    if(error){
        console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
        fs.mkdirSync('uploads');
    }
    console.log('이미지 파일 리스트:',filelist);
});

cleanfiles; //사진 파일 삭제

//사진 업로드 관련 설정
const upload = multer({
    storage: multer.diskStorage({
        destination(req,file,cb){
            cb(null,'uploads/');
        },
        filename(req,file,cb){
            const ext = path.extname(file.originalname);
            cb(null,path.basename(file.originalname,ext) + new Date().valueOf() + ext);
        },
    }),
    limits: {fileSize: 5 * 1024 * 1024},
});
//미리보기를 위한 코드
router.post('/img', isLoggedIn, upload.single('img'), (req,res)=>{
    res.json({url:`/img/${req.file.filename}`});
});
//장소 게시글 입력시 
const upload2 = multer();
router.post('/place',isLoggedIn, upload2.none(), async(req,res,next)=>{
    try{
        const post = await Post.update({
            content: req.body.placeContent,
            rate: req.body.star,
            img: req.body.url,
            like:0,
        },{where:{name:req.body.placeName,id:req.body.placeIdent}});
        res.redirect('/');
    }catch(error){
        console.error(error);
        next(error);
    }
});

//덧글입력관련 주소
router.post('/reply', async(req,res,next)=>{
    try{
        console.log('검증::',req.body.replyContent,req.body.contentId,req.body.replyuser,);
        const reply = await Reply.create({
            reply:req.body.replyContent,
            postId:req.body.contentId,
            userId:req.body.replyuser,
        });
        console.log('create는 뭐가 뜰까?',reply);// 객체가 뜬다!!
        const placeinfo = await Post.find({where:{id:req.body.contentId}});
        res.redirect(`/reply/${placeinfo.name}/${placeinfo.userId}`);
    }catch(error){
        console.error(error);
        next(error);
    }
});
//좋아요 클릭시 DB에 저장
router.post('/like', async(req,res,next) => {
    try{
        const {like,postId,userId} = req.body;
        //console.log('이건 잘 나올까?',like,postId,userId,'라이크타입이뭐냐?',typeof(like));//string 타입임
        const like1 = await Like.find({where:{postId:postId,userId:userId}});
        //console.log('라이크1:',like1);
        if(like1 === null){
            await Like.create({like:like,postId:postId,userId:userId});
        }else{
            await Like.update({like:like},{where:{postId:postId,userId:userId}});
        }
        //console.log('여기까진 나오나?');
        //console.log('포스트아디:',postId);
        const likecount = await Like.findAll({where:{postId:postId}});
        console.log('갯수!!',likecount.length,typeof(likecount));
        const test = JSON.stringify(likecount);
        const test1 = JSON.parse(test);
        let test2 = [];
        for(let a=0; a<test1.length;a++){
            if(test1[a].like === 'true'){
                test2.push(test1[a]);
            }
        }
        //console.log('테스트2 길이!!',test2.length);
        ////이부분부터하기 postId 찾을 수 없다고 나옴 Error: Unknown column 'postId' in 'where clause'
        await Post.update({like:test2.length},{where:{id:postId}});
        return res.send(likecount);
        // const like2 = await Like.findAll({where:{postId:req.body.postId,like:'true'}});
        // 왜그런건지 모르겠는데... 위의 것을 실행하면.. TypeError: s.replace is not a function 에러가 뜬다
        // like를 검색하는데.. 문제가 있다. 이부분은 잘 모르겠다
        // console.log('라이크2:',like2);
        // const likecount = like2.length;
        // await Post.update({like:likecount},{where:{id:postId}});
        // res.json(likecount);
    }catch(error){
        console.error(error);
        next(error);
    }
});
//게시글 수정업데이트
router.post('/reply/update', async(req,res,next)=>{
    try{
        const {contentId,placeContent,url,star,placename,contentwriter} = req.body;
        const post = await Post.update({
            content:placeContent,
            img:url,
            rate:star,
        },{where:{
            id:contentId,
        }});
        console.log('update는 뭐가 뜰까?',post);//그냥 [1] 이렇게 배열안에 숫자가 들어간다//create는 객체로 뜸
        res.redirect(`/reply/${placename}/${contentwriter}`);
    }catch(error){
        console.error(error);
        next(error);
    }
});

module.exports = router;