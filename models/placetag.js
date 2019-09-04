module.exports = (sequelize, DataTypes) => (
  sequelize.define('placetag', {
    title: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true, //같은 해쉬태그가 있다면 flash()로 미리 경고해주기(기존게시글 삭제시 같은단어추가안됨)
    },              //addHashtags로 관계를 추가하기 전에 이미 findOrCreate로 기존의 hashtag를 찾기 때문에
  }, {              //hashtag를 지우지 않는 이상 상관없다
    timestamps: true,
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
  })
);
