function app_loaded(){
  start_game();// make views and interact
}
// Initiate Game state - required to be called 'state'
var state = new GameState(); // GameState to initialize in game script
var vt;
var snd=new SoundBank();
var music=new Music(snd);
user.name='Sure'; 
user.address='DTC'; 

