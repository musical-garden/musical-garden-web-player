import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLyricPaintGate } from '../src/lyricPaintGate.ts';
test('plain lyrics skip repeated samples and repaint for forward/backward seeks', () => {
 const paint=createLyricPaintGate();
 assert.equal(paint(0,false),true);
 for (let i=0;i<300;i++) assert.equal(paint(0,false),false);
 assert.equal(paint(10,false),true);
 assert.equal(paint(2,false),true);
 assert.equal(paint(-1,false),true);
 assert.equal(paint(-1,false),false);
});
test('karaoke keeps every sample while entering plain lyrics resumes gating', () => {
 const paint=createLyricPaintGate();
 for (let i=0;i<30;i++) assert.equal(paint(0,true),true);
 assert.equal(paint(1,false),true);
 assert.equal(paint(1,false),false);
 assert.equal(createLyricPaintGate()(1,false),true);
});
