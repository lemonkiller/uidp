/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import {
  generateId,
  isValidComponentType,
  calculateCanvasSize,
  parseUIDP,
  convertFromUIDP,
  convertToUIDP,
} from './uidp';
import type { UIDPShape } from '../types';
import { translations } from '../i18n';

describe('uidp', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toContain('-');
      expect(id1.length).toBeGreaterThan(10);
    });
  });

  describe('isValidComponentType', () => {
    it('should return true for valid component types', () => {
      expect(isValidComponentType('button')).toBe(true);
      expect(isValidComponentType('input')).toBe(true);
      expect(isValidComponentType('select')).toBe(true);
      expect(isValidComponentType('checkbox')).toBe(true);
      expect(isValidComponentType('radio')).toBe(true);
      expect(isValidComponentType('textarea')).toBe(true);
      expect(isValidComponentType('switch')).toBe(true);
      expect(isValidComponentType('label')).toBe(true);
      expect(isValidComponentType('image')).toBe(true);
      expect(isValidComponentType('container')).toBe(true);
    });

    it('should return false for invalid component types', () => {
      expect(isValidComponentType('invalid')).toBe(false);
      expect(isValidComponentType('')).toBe(false);
      expect(isValidComponentType('div')).toBe(false);
      expect(isValidComponentType('span')).toBe(false);
    });
  });

  describe('calculateCanvasSize', () => {
    it('should return zero size for empty elements', () => {
      const result = calculateCanvasSize([]);
      expect(result).toEqual({ width: 0, height: 0 });
    });

    it('should calculate correct canvas size for single element', () => {
      const elements = [
        { x: 10, y: 20, width: 100, height: 50 },
      ];
      const result = calculateCanvasSize(elements);
      expect(result).toEqual({ width: 100, height: 50 });
    });

    it('should calculate correct canvas size for multiple elements', () => {
      const elements = [
        { x: 0, y: 0, width: 50, height: 50 },
        { x: 100, y: 100, width: 50, height: 50 },
      ];
      const result = calculateCanvasSize(elements);
      expect(result).toEqual({ width: 150, height: 150 });
    });

    it('should skip deleted elements', () => {
      const elements = [
        { x: 0, y: 0, width: 50, height: 50 },
        { x: 100, y: 100, width: 50, height: 50, isDeleted: true },
      ];
      const result = calculateCanvasSize(elements);
      expect(result).toEqual({ width: 50, height: 50 });
    });

    it('should handle negative coordinates', () => {
      const elements = [
        { x: -50, y: -30, width: 100, height: 80 },
      ];
      const result = calculateCanvasSize(elements);
      expect(result).toEqual({ width: 100, height: 80 });
    });
  });

  describe('parseUIDP', () => {
    it('should return null for empty content', () => {
      const result = parseUIDP('');
      expect(result).toBeNull();
    });

    it('should parse META line correctly', () => {
      const content = `META:canvas=800x600 | unit=px | preset=mobile | presetSize=375x667

#0 | T:artboard | R:0,0,375,667 | Z:0 | PRESET:mobile`;
      const result = parseUIDP(content);
      expect(result).not.toBeNull();
      expect(result!.meta).toEqual({
        canvas: '800x600',
        unit: 'px',
        preset: 'mobile',
        presetSize: '375x667',
      });
    });

    it('should parse artboard correctly', () => {
      const content = `META:canvas=400x300 | unit=px | preset=custom | presetSize=400x300

#0 | T:artboard | R:0,0,400,300 | Z:0 | PRESET:custom`;
      const result = parseUIDP(content);
      expect(result).not.toBeNull();
      expect(result!.shapes).toHaveLength(1);
      expect(result!.shapes[0]).toMatchObject({
        type: 'artboard',
        x: 0,
        y: 0,
        width: 400,
        height: 300,
        zIndex: 0,
        preset: 'custom',
      });
    });

    it('should parse rectangle shape correctly', () => {
      const content = `META:canvas=400x300 | unit=px | preset=custom | presetSize=400x300

#0 | T:artboard | R:0,0,400,300 | Z:0 | PRESET:custom
#1 | T:rect | R:50,50,100,80 | Z:1`;
      const result = parseUIDP(content);
      expect(result).not.toBeNull();
      expect(result!.shapes).toHaveLength(2);
      expect(result!.shapes[1]).toMatchObject({
        type: 'rect',
        x: 50,
        y: 50,
        width: 100,
        height: 80,
        zIndex: 1,
      });
    });

    it('should parse shape with component type', () => {
      const content = `META:canvas=400x300 | unit=px | preset=custom | presetSize=400x300

#0 | T:artboard | R:0,0,400,300 | Z:0 | PRESET:custom
#1 | T:rect | R:50,50,100,40 | Z:1 | C:button`;
      const result = parseUIDP(content);
      expect(result).not.toBeNull();
      expect(result!.shapes[1]).toMatchObject({
        type: 'rect',
        component: 'button',
      });
    });

    it('should parse text shape correctly', () => {
      const content = `META:canvas=400x300 | unit=px | preset=custom | presetSize=400x300

#0 | T:artboard | R:0,0,400,300 | Z:0 | PRESET:custom
#1 | T:text | R:50,50,100,30 | Z:1 | TXT:Hello World`;
      const result = parseUIDP(content);
      expect(result).not.toBeNull();
      expect(result!.shapes[1]).toMatchObject({
        type: 'text',
        text: 'Hello World',
      });
    });

    it('should decode escaped text content', () => {
      const content = `META:canvas=400x300 | unit=px | preset=custom | presetSize=400x300

#0 | T:artboard | R:0,0,400,300 | Z:0 | PRESET:custom
#1 | T:text | R:50,50,100,30 | Z:1 | TXT:A%20%7C%20B`;
      const result = parseUIDP(content);
      expect(result).not.toBeNull();
      expect(result!.shapes[1]).toMatchObject({
        type: 'text',
        text: 'A | B',
      });
    });

    it('should skip comment lines', () => {
      const content = `# This is a comment
META:canvas=400x300 | unit=px | preset=custom | presetSize=400x300

# Another comment
#0 | T:artboard | R:0,0,400,300 | Z:0 | PRESET:custom`;
      const result = parseUIDP(content);
      expect(result).not.toBeNull();
      expect(result!.shapes).toHaveLength(1);
    });

    it('should sort shapes by zIndex', () => {
      const content = `META:canvas=400x300 | unit=px | preset=custom | presetSize=400x300

#0 | T:artboard | R:0,0,400,300 | Z:0 | PRESET:custom
#1 | T:rect | R:50,50,100,40 | Z:3
#2 | T:rect | R:60,60,100,40 | Z:1
#3 | T:rect | R:70,70,100,40 | Z:2`;
      const result = parseUIDP(content);
      expect(result).not.toBeNull();
      // Artboard should be first, then sorted by zIndex
      expect(result!.shapes[0].type).toBe('artboard');
      expect(result!.shapes[1].zIndex).toBe(1);
      expect(result!.shapes[2].zIndex).toBe(2);
      expect(result!.shapes[3].zIndex).toBe(3);
    });
  });

  describe('convertFromUIDP', () => {
    it('should convert artboard correctly', () => {
      const shapes: UIDPShape[] = [
        {
          id: 'artboard-1',
          type: 'artboard',
          x: 0,
          y: 0,
          width: 400,
          height: 300,
          zIndex: 0,
          preset: 'custom',
        },
      ];
      const result = convertFromUIDP(shapes, {});
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'frame',
        x: 0,
        y: 0,
        width: 400,
        height: 300,
      });
    });

    it('should convert rectangle shape correctly', () => {
      const shapes: UIDPShape[] = [
        {
          id: 'artboard-1',
          type: 'artboard',
          x: 0,
          y: 0,
          width: 400,
          height: 300,
          zIndex: 0,
        },
        {
          id: 'rect-1',
          type: 'rect',
          x: 50,
          y: 60,
          width: 100,
          height: 80,
          zIndex: 1,
        },
      ];
      const result = convertFromUIDP(shapes, {});
      expect(result).toHaveLength(2);
      expect(result[1]).toMatchObject({
        type: 'rectangle',
        x: 50,
        y: 60,
        width: 100,
        height: 80,
        backgroundColor: 'transparent',
      });
    });

    it('should convert circle shape to ellipse', () => {
      const shapes: UIDPShape[] = [
        {
          id: 'artboard-1',
          type: 'artboard',
          x: 0,
          y: 0,
          width: 400,
          height: 300,
          zIndex: 0,
        },
        {
          id: 'circle-1',
          type: 'circle',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          zIndex: 1,
        },
      ];
      const result = convertFromUIDP(shapes, {});
      expect(result).toHaveLength(2);
      expect(result[1]).toMatchObject({
        type: 'ellipse',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
      });
    });

    it('should convert text shape correctly', () => {
      const shapes: UIDPShape[] = [
        {
          id: 'artboard-1',
          type: 'artboard',
          x: 0,
          y: 0,
          width: 400,
          height: 300,
          zIndex: 0,
        },
        {
          id: 'text-1',
          type: 'text',
          x: 50,
          y: 50,
          width: 100,
          height: 30,
          zIndex: 1,
          text: 'Hello World',
        },
      ];
      const result = convertFromUIDP(shapes, {});
      expect(result).toHaveLength(2);
      expect(result[1]).toMatchObject({
        type: 'text',
        text: 'Hello World',
        originalText: 'Hello World',
        fontSize: 20,
      });
    });

    it('should convert line shape correctly', () => {
      const shapes: UIDPShape[] = [
        {
          id: 'artboard-1',
          type: 'artboard',
          x: 0,
          y: 0,
          width: 400,
          height: 300,
          zIndex: 0,
        },
        {
          id: 'line-1',
          type: 'line',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          zIndex: 1,
        },
      ];
      const result = convertFromUIDP(shapes, {});
      expect(result).toHaveLength(2);
      expect(result[1]).toMatchObject({
        type: 'line',
        points: [[0, 0], [100, 100]],
      });
    });

    it('should preserve component type in customData', () => {
      const shapes: UIDPShape[] = [
        {
          id: 'artboard-1',
          type: 'artboard',
          x: 0,
          y: 0,
          width: 400,
          height: 300,
          zIndex: 0,
        },
        {
          id: 'rect-1',
          type: 'rect',
          x: 50,
          y: 50,
          width: 100,
          height: 40,
          zIndex: 1,
          component: 'button',
        },
      ];
      const result = convertFromUIDP(shapes, {});
      expect(result).toHaveLength(2);
      expect(result[1].customData).toEqual({ uidpComponent: 'button' });
    });

    it('should handle coordinates relative to artboard', () => {
      const shapes: UIDPShape[] = [
        {
          id: 'artboard-1',
          type: 'artboard',
          x: 100,
          y: 100,
          width: 400,
          height: 300,
          zIndex: 0,
        },
        {
          id: 'rect-1',
          type: 'rect',
          x: 50, // Relative to artboard
          y: 60, // Relative to artboard
          width: 100,
          height: 80,
          zIndex: 1,
        },
      ];
      const result = convertFromUIDP(shapes, {});
      expect(result).toHaveLength(2);
      // Absolute coordinates = artboard origin + relative coordinates
      expect(result[1].x).toBe(150); // 100 + 50
      expect(result[1].y).toBe(160); // 100 + 60
    });
  });

  describe('convertToUIDP', () => {
    it('should escape text content containing separators', () => {
      const result = convertToUIDP(
        [
          {
            id: 'frame-1',
            type: 'frame',
            x: 0,
            y: 0,
            width: 400,
            height: 300,
          },
          {
            id: 'text-1',
            type: 'text',
            x: 50,
            y: 50,
            width: 100,
            height: 30,
            text: 'A | B',
          },
        ],
        'mobile',
        375,
        667,
        translations.en,
      );

      expect(result).toContain('TXT:A%20%7C%20B');
    });
  });
});
