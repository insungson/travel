const express = require('express');
const path = require('path');
const fs = require('fs');

const {User,Post,Reply,Like} = require('../models');
const {isLoggedIn} = require('./middlewares');

const router = express.Router();
//게시글 삭제
router.get('/content/:id',async(req,res,next)=>{
    try{
        let conetentid = req.params.id;
        const content = await Post.destroy({where:{id:conetentid}});
        const like = await Like.destroy({where:{postId:conetentid}});
        const reply = await Reply.destroy({where:{postId:conetentid}});
        console.log('결과를 보자',content,like,reply); //적용된 숫자가 뜬다
        if(content !== null){
            req.flash('cancel',`해당게시글 ${content}개, 덧글 ${reply}개 삭제되었습니다.`);
        }else{
            req.flash('cancel','삭제할 게시글이 없습니다.');
        }
        res.redirect('/');
    }catch(error){
        console.error(error);
        next(error);
    }
});
//장소글쓰기 취소관련
router.get('/cancel/:id', async(req,res,next)=>{
    try{
        let cancelid = req.params.id;
        const placecancel = await Post.destroy({where:{id:cancelid}});
        req.flash('cancel','장소 글쓰기 취소처리 완료');
        res.redirect('/');
    }catch(error){
        console.error(error);
        next(error);
    }
});
//댓글 삭제 관련
router.get('/reply/:id', async(req,res,next) => {
    try{
        let replyid = req.params.id;
        const contentname = await Reply.find({
            where:{id:replyid},
            include:{
                model:Post,
                attributes:['id','name','userId'],
            }
        });
        let replynum = await Reply.destroy({where:{id:replyid}});
        req.flash('cancel',`${contentname.post.name} 게시글에서 ${replynum}개 댓글을 삭제하였습니다`);
        res.redirect(`/reply/${contentname.post.name}/${contentname.post.userId}`);
        //reply/${showPlace.name}/${showPlace.userId}
    }catch(err){
        console.error(err);
        next(err);
    }
});


module.exports = router;