/** Config */

const Config = {};

Config.size = 512;
Config.margin = 64;
Config.buttonWidth = 256;
Config.buttonHeight = 48;
Config.lineHeight = 24;
Config.characterWidth = 13;
Config.buttonHoverColour = '#000088';
Config.backgroundColour = '#000';
Config.centreX = Config.size / 2;
Config.centreY = Config.size / 2;
Config.top = Config.margin;
Config.left = Config.margin;
Config.bottom = Config.size - Config.margin;
Config.right = Config.size - Config.margin;
Config.innerWidth = Config.size - Config.margin * 2;
Config.innerHeight = Config.size - Config.margin * 2;
Config.wipeSpeed = Config.innerHeight * 3;

export default Config;