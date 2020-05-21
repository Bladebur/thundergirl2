# Perils of Thunder Girl 2

A short-ish interactive fiction game written in Typescript.
Uses pixi.js (https://www.pixijs.com/) for graphics and
pizzicato.js (https://alemangui.github.io/pizzicato/) for audio.

The original used webpack, but I was not able to make that work
again due to Javascript tooling system shenanigans, so I
switched to Parcel in order to ensure the release at least works.

The game is sort of a 'escape the room' puzzle with a superhero
and a horror/somewhat bondagey theme. It is pretty hard due to
the intended solution being somewhat far-fetched, the number
of red herrings, the time limit, and the inherent problems of
the genre (sometimes you figure out the solution but the way
you express it is not one the program recognizes, which can led
to many frustrations).

You can activate the hints system typing HELP, and then every
time you die you'll get a progressively more detailed. You can
also type HELP once the hints are active in order to get a hint
immediately.

Unlike the first game, this one ditches the retro feel and 
introduces full resolution images, music, and a menu-based 
intro. The engine is mostly the same, but ported to Typescript,
which proved to be a lot more productive thanks to more
reliable code completion.

The original was intended to be an adult game. There is no sex
themes in the final game, but the gore and skimpy female forms 
depicted could be considered NSFW and offensive for some.

The game is purely graphical (even the input!) so it won't be 
compatible with tables or accessibility tools. Sorry!

## Running the game

    npm install
    npm start

## Solution

EXAMINE STOCKS
REMOVE RIGHT GLOVE
REMOVE RIGHT GLOVE
REMOVE RIGHT GLOVE
REMOVE RIGHT GLOVE
REMOVE RIGHT GLOVE
EXAMINE FEET
REMOVE BOOTS
REMOVE BOOTS
REMOVE BOOTS
REMOVE BOOTS
REMOVE BOOTS
KICK TABLE
EXAMINE TABLE
EXAMINE FRAME
EXAMINE BARS
TAKE BAR
EXAMINE ROPES
UNTIE NECK ROPES

... [wait until counter reaches 00:00] ...

STOP BLADE WITH FEET
PUT BAR IN PADLOCK
LOWER BLADE
PUSH BLADE UP
OPEN STOCKS
GET UP