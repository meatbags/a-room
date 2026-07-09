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

const cx = Config.centreX;
const cy = Config.centreY;
const margin = Config.margin;
const title = Config.top + margin * 0.75;

Config.manifest = {
  screens: [{
    name: 'home',
    elements: [
      { type: 'text', text: '[ MAGELLANIC INTRANET ]', x: cx, y: title },
      { type: 'button', text: 'SIGN IN', x: cx, y: title + margin * 1.5, onClick: { screen: 'login' } },
      { type: 'button', text: 'MAP', x: cx, y: title + margin * 2.5, onClick: { screen: 'map' } },
      { type: 'button', text: 'LOGS', x: cx, y: title + margin * 3.5, onClick: { screen: 'logs' } },
    ],
  }, {
    name: 'login',
    parent: 'home',
    elements: [
      { type: 'text', text: '[ SELECT ACCOUNT ]', x: cx, y: title },
      { type: 'button', text: 'BOHM', x: cx, y: title + 1 * margin, onClick: { pin: 'bohm' } },
      { type: 'button', text: 'HARI', x: cx, y: title + 2 * margin, onClick: { pin: 'hari' } },
      { type: 'button', text: 'KELVIN', x: cx, y: title + 3 * margin, onClick: { pin: 'kelvin' } },
      { type: 'button', text: 'KOLODNY', x: cx, y: title + 4 * margin, onClick: { pin: 'kolodny' } },
      { type: 'button', text: 'RIJNDAEL', x: cx, y: title + 5 * margin, onClick: { pin: 'rijndael' } },
      { type: 'button', text: 'SOROKIN', x: cx, y: title + 6 * margin, onClick: { pin: 'sorokin' } },
      { type: 'button', text: 'TAO', x: cx, y: title + 7 * margin, onClick: { pin: 'tao' } },
    ],
  }, {
    name: 'map',
    parent: 'home',
    elements: [
      { type: 'map', title: 'VFP MAGELLANIC', modules: [
        '1: Cryo',
        '2: Medical',
        '3: Hub',
        '4: Oxygen/Quarters (1)',
        '5: Greenhouse',
        '6: Engineering',
        '7: ',
        '8: Quarters (2)',
        '9: ',
        '10: ',
        '11: ',
        '12: Observatory',
        '13: Command',
      ] },
    ]
  }, {
    name: 'pin',
    parent: 'home',
    type: 'pinScreen',
    users: {
      bohm: { password: 0b1000001000000, hint: 'hint' },
      hari: { password: 0b0000001000000, hint: 'hint' },
      kelvin: { password: 0b0000001000000, hint: 'hint' },
      kolodny: { password: 0b0000001000000, hint: 'hint' },
      rijndael: { password: 0b0000001000000, hint: 'hint' },
      sorokin: { password: 0b0000001000000, hint: 'hint' },
      tao: { password: 0b0000001000000, hint: 'hint' },
    },
  }, {
    name: 'user',
    type: 'userScreen',
    parent: 'login',
    users: {
      bohm: {},
      hari: { 
        messages: [{
          date: '2206-12-02 0910', 
          from: 'KOLODNY', 
          subject: 'Hey',
          rows: [
            'Here\'s the data you wanted',
            '',
            '======+=====+======+======',
            ' 0.21 | 1.0 | 0.57 | 0.53 ',
            '======+=====+======+======',
            ' 0.01 | 1.0 | 0.11 | 0.54 ',
            '======+=====+======+======',
            ' 0.01 | 0.9 | 0.03 | 0.03 ',
            '======+=====+======+======',
            '',
            '- Rose'
          ],
        }, {
          date: '2206-12-02 0900', 
          from: 'KOLODNY', 
          subject: 'Report',
          rows: [
            'Here\'s the data you wanted',
            '',
            '======+=====+======+======',
            ' 0.21 | 1.0 | 0.57 | 0.53 ',
            '======+=====+======+======',
            ' 0.01 | 1.0 | 0.11 | 0.54 ',
            '======+=====+======+======',
            ' 0.01 | 0.9 | 0.03 | 0.03 ',
            '======+=====+======+======',
            '',
            '- Rose'
          ],
        }],
        logs: [{
          date: '2206-11-01 1310',
          subject: 'Log',
          rows: ['Feeling better']
        }, {
          date: '2206-10-24 0051', 
          subject: 'lo g', 
          rows: ['I\'m a wake it fi nds o']
        }]
      },
      kelvin: {},
      kolodny: {},
      rijndael: {},
      sorokin: {},
      tao: {},
    }
  }, {
    name: 'logs',
    parent: 'home',
    elements: [
      { type: 'text', text: '[ LOGS ]', x: cx, y: title },
      { type: 'text', x: 80, y: title + margin, width: Config.characterWidth * 26, rows: [
        'VFP MAGELLANIC',
        '-------+------------------',
        'MFR    | ACX HEAVY INDS',
        'CLASS  | Gospodin',
        'REG    | 513793/CTA',
        'GT     | 19,000',
        'COSPAR | 2096-6311A',
        '-------+------------------',
        '',
        'CREW MANIFEST',
        '--------------------------',
        'POSITION   | NAME',
        '-----------+--------------',
        'Captain    | D. BOHM ',
        'Pilot      | R. KOLODNY',
        'Engineer   | C. KELVIN',
        'Engineer   | T. TAO ',
        'Biologist  | N. HARI ',
        'Medical    | J. RIJNDAEL',
        'Navigator  | V. SOROKIN',
        '-----------+--------------',
      ]}
    ]
  }]
};

export default Config;