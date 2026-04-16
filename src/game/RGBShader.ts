import Phaser from 'phaser';

// 1. The GLSL Program (Runs on the GPU)
const rgbShader = `
precision mediump float;

// These two lines are mandatory for Phaser to pass the image data!
uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

// Our custom colors
uniform vec3 primaryColor;
uniform vec3 secondaryColor;
uniform vec3 visorColor;

void main(void) {
    // Look at the original pixel on the sprite (Note the correct spelling of uMainSampler!)
    vec4 pixel = texture2D(uMainSampler, outTexCoord);
    
    // Apply our magic math
    vec3 finalColor = (pixel.r * primaryColor) + (pixel.b * secondaryColor) + (pixel.g*visorColor);
    
    // Output the new color, keeping the original transparency
    gl_FragColor = vec4(finalColor, pixel.a);
}
`;

export class RGBMaskPipeline
  extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline
{
  primaryRGB: number[] = [1, 1, 1];
  secondaryRGB: number[] = [0.5, 0.5, 0.5];
  visorRGB: number[];

  constructor(game: Phaser.Game) {
    super({ game, fragShader: rgbShader });
    const v = Phaser.Display.Color.ValueToColor(0x9ae5e6);
    this.visorRGB = [v.redGL, v.greenGL, v.blueGL];
  }

  onPreRender() {
    this.set3f(
      'visorColor',
      this.visorRGB[0],
      this.visorRGB[1],
      this.visorRGB[2],
    );
    this.set3f(
      'primaryColor',
      this.primaryRGB[0],
      this.primaryRGB[1],
      this.primaryRGB[2],
    );
    this.set3f(
      'secondaryColor',
      this.secondaryRGB[0],
      this.secondaryRGB[1],
      this.secondaryRGB[2],
    );
  }
}
export const CrewmateColors: Record<string, any> = {
  red: { primary: 0xff0000, secondary: 0x8b0000 },
  blue: { primary: 0x0000ff, secondary: 0x00008b },
  pink: { primary: 0xff69b4, secondary: 0xc71585 },
  yellow: { primary: 0xffff00, secondary: 0xb8b800 },
  black: { primary: 0x333333, secondary: 0x111111 },
};
