
/* avatar object */
function Avatar(dom, index, game){
  this.game = game;
  this.dom = dom;
  this.index = index;
  this.height = this.dom.clientHeight;
  this.width = this.dom.clientWidth;   
  this.rightEnd = this.game.game_window.right - (2 * this.width);
  this.bottomEnd = this.game.game_window.bottom - (2 * this.height);
  this.active = false

  /* move avatar -> left -> down -> right -> down ... -> and so on 
     when the bottom is reached notify the game object and disable
     onclick even handling  
   */
  this.move = function(){

    this.x = this.x + (this.direction * this.speed);
    if ((this.x >= this.rightEnd) ||  (this.x <= 0)) {
      this.y = this.y + this.height;
      this.direction *= (-1);
      if (this.y > this.bottomEnd ){
        this.game.avatarFinished(this.index);
        this.dom.onclick = null;
        this.hide();
      } else {
        this.show();
      }
    } else {
      this.show();
    }
  };

  /* activate avatar's click handler  */
  this.activate = function(){
    if (this.active == false){
      this.active = true;
      this.dom.onclick = this.game.onAvatarClick();
    }
  };

  /* show avatar at the specified location */
  this.show = function(){
    this.dom.style.left = this.x +"px";
    this.dom.style.top = this.y + "px";
    this.dom.classList.add("level0"); 
  };

  this.hide = function() {
    this.dom.classList.remove("level0"); 
    /* also de-activate */
    this.active = false;
    this.dom.onclick =null;
  }

  /* reset avatar to the default setting (for position use the parameters  avatar 
     was created with) */
  this.reset = function(){
    this.direction = 1;
    this.x = this.startX;
    this.y = this.startY;
    this.setSpeed(10);
    this.dom.onclick = this.game.onAvatarClick();
  };

  /**/
  this.setSpeed = function(spd){
    console.log ('setting speed to ' + spd);
    this.speed = spd;
  };

  /* initialise avatar */
  this.init = function(posX, posY, direction, useOffset){
    this.direction = direction;
    if (useOffset == true){
        this.startX = posX + (this.index * this.width);
    } else {
        this.startX = posX;  
    }
    this.startY = posY;
    this.x = this.startX;
    this.y = this.startY;
    this.setSpeed(10);
  };
};


/* Invaders Game Object */
function InvadersGame (domContainer){
    this.domContainer = domContainer;
    this.dom = this.domContainer.ownerDocument;
    this.score_display = this.dom.getElementById('score');
    this.attempts_display = this.dom.getElementById('attempts');
    this.score = 0;
    this.animation = null;
    this.moveSpeed = 100; /* this is the timer delay */
    this.activeAvatars = [];
    this.attempts = 0;

    this.updateScore = function(){
      this.score_display.innerText = this.score;
    }

    this.updateAttempts = function(){
      this.attempts_display.innerText = this.attempts;
    }

    /* handle move for all active avatars  */
    this.onGameMove = function() {
      let game = this;
      return function() {
        game.activeAvatars.forEach( function(e){
            game.avatars[e].activate();
            game.avatars[e].move();
          }, game);
        };
    };

    /* handle game start button  */
    this.start = function(){
      window.clearInterval(this.animation);
      this.animation = window.setInterval(this.onGameMove(), this.moveSpeed);
    };

    /* handle game stop button  */
    this.stop = function(){
        window.clearInterval(this.animation);
    };

    /* reset avatrs  */
    this.resetAvatars = function(){
      this.activeAvatars = [];
      this.avatars.forEach(function(e) {
        e.reset();
        e.show();
        this.activeAvatars.push(e.index);
      }, this);
      
    };

    /* use closure to provide the handler with access to the game object  */
    this.onButtonClick = function () {
      let game = this;
      return function() {
        if (this.id == 'start') {
          game.start();     
        } else if (this.id == 'stop') {
          game.stop();
        } else if (this.id == 'reset'){
          game.resetAvatars();
          game.score = 0;
          game.updateScore();
          game.attempts = 0;
          game.updateAttempts();
        } else if (this.id == 'again'){
          game.stop();
          game.resetAvatars();
          game.score = 0;
          game.updateScore();
          game.attempts += 1;
          game.updateAttempts();
        };
      };
    };

    /* use closure to provide the handler with access to the game object  */
    this.onChangeDifficulty = function () {
      let game = this;
      return function() {
        console.log("difficulty changed " + this.id);
        if (this.id =='d_hard'){
          game.activeAvatars.forEach( function(e){
            game.avatars[e].setSpeed(30);  
          }, game);
        } else {
          game.activeAvatars.forEach( function(e){
            game.avatars[e].setSpeed(10);  
          }, game);
        
        };   
      }
    };

    /* handle avatar click event  */
    this.onAvatarClick = function() {
      let game = this;
      return function() {
        game.score += 1;
        game.updateScore();
      };
    };

    /* mark avatar as finished - 
       perhaps remove click handler etc*/
    this.avatarFinished = function (index) {
      this.activeAvatars = this.activeAvatars.filter(function(e) {
        return (e != index);
      })
      console.log(this.activeAvatars);
      if (this.activeAvatars.length == 0){
        alert("Game Over!");
      }
    };

    /* initialise game object - gui/counters etc */
    this.init = function(){

      /* Init GUI components */
      ['start', 'stop', 'reset', 'again'].map(
        function(e){
          /* need to call the function here to use the closure */
          this.dom.getElementById(e).onclick = this.onButtonClick();
        }, this);
          
      ['d_easy', 'd_hard'].map(
        function(e){
          /* need to call the function here to use the closure */
          this.dom.getElementById(e).onclick = this.onChangeDifficulty();
        }, this);

      /* set game window boundaries */
      this.game_window = {
        left: 0,
        right: this.domContainer.clientWidth,
        top: 0,
        bottom: this.domContainer.clientHeight
      };

      /* Init avatars */
      let elemLst = this.dom.querySelectorAll('.avatar');
      this.avatars = [];
      if (elemLst != null) {
        elemLst.forEach(function(e, index){
          let avtr = new Avatar(e, index, this);
          avtr.init(0, 20, 1, true);
          avtr.show();
          this.avatars.push(avtr);
          this.activeAvatars.push(index);
        }, this)}
    };
};

window.onload = function() {
  var gcDomContainer= document.getElementById('game_console');
  var invaders = new InvadersGame(gcDomContainer);
  invaders.init();
}