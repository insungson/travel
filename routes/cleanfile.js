const fs = require('fs');
const path = require('path');
const {Post} = require('../models');

//사진파일 삭제를 위한 코드 
exports.cleanfiles = setInterval(async (req, res, next) => {
    let realarray;
    let dbarray = [];

    try {
        //upload폴더에 있는 사진파일들 선택
        fs.readdir('uploads', (error, filelist) => {
            if (error) {
                console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
                fs.mkdirSync('uploads');
            }
            realarray = filelist;
            //console.log('이미지 파일 리스트:',filelist);
        });
        //디비에 저장된 사진 목록 가져오기(multer에서 만든 img없애기)
        let result = await Post.findAll({});
        result.forEach(element => {
            let img = element.img;
            let j = img.length;
            let name = img.slice(5, j);
            // console.log(element.img);
            // console.log(name);
            dbarray.push(name);
            // console.log(dbarray);
        });
        //console.log('내가추출한 파일이름 ',dbarray,'이미지파일리스트',realarray);
        //DB이미지 파일, 폴더내의 이미지파일들 비교하여 DB이미지 파일을 제외한 폴더내 이미지 파일들 선택
        for (let i = 0; i < dbarray.length; i++) {
            for (let j = 0; j < realarray.length; j++) {
                if (dbarray[i] == realarray[j]) {
                    realarray = realarray.slice(0, j).concat(realarray.slice(j + 1, realarray.length));
                }
            }
        }
        //console.log('없는 것만 모음',realarray,'../uploads');
        //사진파일이 저장된 경로 설정후 파일 삭제
        realarray.forEach(ex => {
            // console.log(__dirname);
            let ok = path.join(__dirname, '../uploads');
            // console.log(ok);
            // console.log(ok+'\\'+ex);
            let del = ok + '\\' + ex;
            fs.unlink(del, (err) => {
                if (err) { console.error(err); } else { console.log('삭제완료'); }
            });
        });
    } catch (error) {
        console.error(error);
    }
}, 60*1000);//1분에 1번 사진파일 정리