console.log("Game objects : init");
app_loaded();

/**
 * API:
 * CREATE ROOMS, ITEMS and PEOPLES
 *     <Room>=newRoom(id, img, props) set a new room variable named $id
 *     <Item>=<Room>.newItem(id, img)
 *     <People>=<Room>.newPeople(id, img)
 *     id : non 'room_' part of a key 'room_<id>' in GameDialogs file
 *              GameDialogs file shall contain :
 *               - room_<roomid> :      the name of the room
 *               - room_<roomid>_text : the description of what happening in
 *                                      the room
 *          non 'item_' (or 'people_') part of a key 'item_<id>' in GameDialogs file
 *              GameDialogs file shall contain :
 *               - item_<id>   :      the name of the item
 *              ( - people_<id> :      the name of the person )
 *               - item_<id>_text   : a description
 *              ( - people_<id>_text : a description )
 *     img : img file in image directory
 *
 *     props : hash without many optionnal properties like executable, readable, writable
 *
 *    Return the <Room> object and define $varname variable (='$'+id)
 *
 *    Note : $home is required , in order to define path '~/', and command 'cd'.
 *
 * CONNECT ROOMS
 *    <Room>.addPath(<Room>)
 *
 * FIRST PROMPT
 *    If the player start a game or load it from saved state,
 *    you can display a message for the room she/he starts.
 *    Default is the result of 'pwd'.
 *    <Room>.setStarterMsg(<welcome_message>);
 *
 * COMMANDS
 *    // alter result of the command
 *    <Room>.setCmdText(<cmd_name>,<cmd_result>)
 *    <Item>.setCmdText(<cmd_name>,<cmd_result>)
 *
 */
// All bash shortcuts : https://ss64.com/bash/syntax-keyboard.html
