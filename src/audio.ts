import * as Pizzicato from 'pizzicato';

let audioFiles = {
    button: [ require("../audio/button.mp3") ],
    geminiIntro: [ require("../audio/intro_gemini.wav") ],
    music_gemini: [ require("../audio/music_gemini.mp3") ],
    music_tension: [ require("../audio/music_tension.mp3") ],
};

export type AudioFile = keyof typeof audioFiles;
let audioReady: Partial<Record<AudioFile, boolean>> = {};
let audioObjects: Partial<Record<AudioFile, Pizzicato.Sound>> = {};

const musicFileVolume: Partial<Record<AudioFile,number>> = {
    'music_gemini': 0.75
};

let pendingMusic: AudioFile;
let currentMusic: AudioFile;
let loaded = false;
let musicVolume = 1;

let fxEnabled = true;
let musicEnabled = true;

function RestoreAudioSettings() {
    let settings = window.localStorage.getItem('musicSettings');
    if (settings !== undefined) {
        let data = JSON.parse(settings);
        if (typeof data === 'object' && data && data.fxEnabled !== undefined) {
            fxEnabled = data.fxEnabled;
            musicEnabled = data.musicEnabled;
        }
    }
}

function SaveAudioSettings() {
    window.localStorage.setItem('musicSettings', JSON.stringify({ fxEnabled, musicEnabled }));
}

export function IsAudioConextSuspended() {
    if (Pizzicato.context && Pizzicato.context.state === 'suspended') {
        fxEnabled = false;
        musicEnabled = false;
        return true;
    }
    return false;
}

export function FXEnabled() {
    return fxEnabled && !IsAudioConextSuspended();
}

export function MusicEnabled() {
    return musicEnabled;
}

export function EnableFX(value: boolean) {
    fxEnabled = value;
    SaveAudioSettings();
}
export function EnableMusic(value: boolean) {
    musicEnabled = value;
    pendingMusic = null;
    if (Pizzicato.context && Pizzicato.context.state === 'suspended' && value) {
        Pizzicato.context.resume();
    }
    if (currentMusic && audioObjects[currentMusic].playing) {
        audioObjects[currentMusic].volume = value ? musicVolume * (musicFileVolume[currentMusic] || 1) : 0;
    }
    SaveAudioSettings();
}

export function Load() {
    for (let key in audioFiles) {
        let isMusic = key.startsWith('music_');
        audioObjects[key] = new Pizzicato.Sound({
            source: 'file',
            options: { path: audioFiles[key], attack: 0, release: isMusic ? 1 : 0 }
        }, () => {
            audioReady[key] = true;
            if (pendingMusic === key)
                PlayMusic(key);
        })
    }
    loaded = true;
}

export function PlayFX(fx: AudioFile) {
    if (!loaded) {
        Load();
    }
    if (audioReady[fx]) {
        if (Pizzicato.context) {
            if (Pizzicato.context.state === 'suspended')
                Pizzicato.context.resume();
        }
        let effect = audioObjects[fx];
        if (audioObjects[fx].playing) {
            effect = audioObjects[fx].clone();
        }
        if (fxEnabled) {
            effect.volume = fxEnabled ? 1 : 0;
            effect.play();
        }
    }
}

function startMusic(music: AudioFile, loop = true) {
    currentMusic = music;
    audioObjects[currentMusic].loop = loop;
    audioObjects[currentMusic].play();
    audioObjects[currentMusic].volume = musicEnabled ? musicVolume * (musicFileVolume[currentMusic] || 1) : 0;
}

export function StopMusic() {
    if (!loaded)
        Load();
    if (!currentMusic)
        return;
    if (currentMusic && audioObjects[currentMusic].playing) {
        audioObjects[currentMusic].stop();
        currentMusic = null;
    }
}

export function PlayMusic(music: AudioFile, loop = true) {
    if (!loaded)
        Load();
    if (currentMusic == music)
        return;
    
    if (audioReady[music]) {
        /* Resume context after user interaction */
        if (Pizzicato.context) {
            if (Pizzicato.context.state === 'suspended')
                Pizzicato.context.resume();
        }
        if (currentMusic && audioObjects[currentMusic].playing) {
            if (music == 'music_gemini') {
                PlayFX('geminiIntro');
                setTimeout(() => audioObjects[currentMusic].stop(), 1000);
                setTimeout(() => startMusic(music, loop), 1000);
            } else {
                audioObjects[currentMusic].stop();
                setTimeout(() => startMusic(music, loop), 400);
            }
        } else {
            startMusic(music, loop);
        }
    } else {
        pendingMusic = music;
    }
}

RestoreAudioSettings();
