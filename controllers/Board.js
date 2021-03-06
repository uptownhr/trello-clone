const router = require('express').Router();
var Board = require('../models/Board'),
    List = require('../models/List');

router.get('/:id', function(req, res){
  
  Board.findOne({_id: req.params.id}, function(err, board){
    if (err || board === null) {
      return res.redirect('/');
    } else {
      List.find({_board: board._id}).exec(function(err, lists){
        var results = {
          board: board,
          lists: lists
        }
        res.render('board', results);
      })
    }
  });
})

router.post('/', function(req, res){
  var body = req.body;

  req.assert('title', 'Title field is required').notEmpty();
  
  var errors = req.validationErrors();

  if (errors) {
    res.send({errors: errors});
  } else {
  
    var board = new Board({
      title : body.title,
      description: body.description,
    });

    board.save(function(err, board){
      if (err) {
        console.log(err);
      }
      res.send({
        errors : '',
        redirect: '/board/' + board._id
      });
    })
  }
})

router.post('/:board/list', function(req, res){
  var body = req.body;
  
  req.assert('title', 'Title field is required').notEmpty();
  var errors = req.validationErrors();

  if (errors) {
    res.send({errors: errors});
  } else {
    var list = new List({
      _board : req.params.board,
      title : body.title
    });
    list.save(function(err, list){
      if (err || list == null) {
        res.sendStatus(500);
      } else {
        Board.findOneAndUpdate(
          { _id : req.params.board },
          { $push: { lists: list._id } },
          { upsert: false },
          function(err){
            if (err) {
              console.log(err);
              res.sendStatus(500);
            }
          }
        );
      }
      res.send(list);
    })
  }
});

router.post('/:board/list/:list/card', function(req, res){
  var body = req.body;
  //create card, add card to list
  req.assert('title', 'Title field is required').notEmpty();
  var errors = req.validationErrors();

  if (errors) {
    res.send({errors: errors});
  } else {
    var card = {
      title : body.title,
      description : ''
    }
    List.findOneAndUpdate(
      { _id : req.params.list },
      { $push: { cards : card } },
      { new: true, upsert: false},
      function(err, list){
        if (err) {
          console.log(err);
          res.sendStatus(500)
        } else {
          res.send(card);
        }
      }
    );
  }
});

module.exports = router