const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User } = require('../models');

const router = express.Router();
//회원가입
router.post('/join', isNotLoggedIn, async(req,res,next)=>{
    const {email,nick,password} = req.body;
    try{
        const exUser = await User.find({where:{email}});
        if(exUser){
            req.flash('joinError', '이미 가입된 메일입니다.');
            return res.redirect('/join');
        }
        const hash = await bcrypt.hash(password, 12);
        await User.create({
            email,
            nick,
            password:hash,
        });
        return res.redirect('/');
    }catch(error){
        console.error(error);
        return next(error);
    }
});
//로그인
router.post('/login', isNotLoggedIn, (req,res,next)=>{
    passport.authenticate('local',(authError,user,info)=>{
        if(authError){
            console.error(authError);
            return next(authError);
        }
        if(!user){
            req.flash('loginError', info.message);
            return res.redirect('/');
        }
        return req.login(user, (loginError)=>{
            if(loginError){
                console.error(loginError);
                return next(loginError);
            }
            return res.redirect('/');
        });
    })(req,res,next);
});
//로그아웃
router.get('/logout', isLoggedIn, (req,res)=>{
    req.logout();
    req.session.destroy();
    res.redirect('/');
});

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao',{
    failureRedirect:'/',
}), (req,res)=>{
    res.redirect('/');
});

router.post('/user/update', async(req,res,next)=>{
    const {id,nick,password} = req.body;
    try{
        const hash = await bcrypt.hash(password, 12);
        await User.update({
            nick:nick,
            password:hash,
        },{where:{id:id}});
        return res.redirect('/');
    }catch(error){
        console.error(error);
        next(error);
    }
});

router.post('/user/delete/:id', async(req,res,next)=>{
    let userid = req.params.id;
    try{
        const name = await User.find({where:{id:userid}});
        await User.destroy({where:{id:userid}});
        req.flash('autherror',`${name.email} 계정이 삭제되었습니다`);
        res.redirect('/');
    }catch(error){
        console.error(error);
        next(error);
    }
});

module.exports = router;