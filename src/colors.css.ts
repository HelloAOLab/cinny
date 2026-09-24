import { createTheme } from '@vanilla-extract/css';
import { color } from 'folds';

export const silverTheme = createTheme(color, {
  Background: {
    Container: '#DEDEDE',
    ContainerHover: '#D3D3D3',
    ContainerActive: '#C7C7C7',
    ContainerLine: '#BBBBBB',
    OnContainer: '#000000',
  },

  Surface: {
    Container: '#EAEAEA',
    ContainerHover: '#DEDEDE',
    ContainerActive: '#D3D3D3',
    ContainerLine: '#C7C7C7',
    OnContainer: '#000000',
  },

  SurfaceVariant: {
    Container: '#DEDEDE',
    ContainerHover: '#D3D3D3',
    ContainerActive: '#C7C7C7',
    ContainerLine: '#BBBBBB',
    OnContainer: '#000000',
  },

  Primary: {
    Main: '#1596CE',
    MainHover: '#1387B9',
    MainActive: '#127FAE',
    MainLine: '#1177A3',
    OnMain: '#FFFFFF',
    Container: '#D7ECF6',
    ContainerHover: '#CAE5F2',
    ContainerActive: '#BDDFEE',
    ContainerLine: '#9FD3EA',
    OnContainer: '#0F6D9C',
  },

  Secondary: {
    Main: '#000000',
    MainHover: '#171717',
    MainActive: '#232323',
    MainLine: '#2F2F2F',
    OnMain: '#EAEAEA',
    Container: '#C7C7C7',
    ContainerHover: '#BBBBBB',
    ContainerActive: '#AFAFAF',
    ContainerLine: '#A4A4A4',
    OnContainer: '#0C0C0C',
  },

  Success: {
    Main: '#017343',
    MainHover: '#01683C',
    MainActive: '#016239',
    MainLine: '#015C36',
    OnMain: '#FFFFFF',
    Container: '#BFDCD0',
    ContainerHover: '#B3D5C7',
    ContainerActive: '#A6CEBD',
    ContainerLine: '#99C7B4',
    OnContainer: '#01512F',
  },

  Warning: {
    Main: '#864300',
    MainHover: '#793C00',
    MainActive: '#723900',
    MainLine: '#6B3600',
    OnMain: '#FFFFFF',
    Container: '#E1D0BF',
    ContainerHover: '#DBC7B2',
    ContainerActive: '#D5BDA6',
    ContainerLine: '#CFB499',
    OnContainer: '#5E2F00',
  },

  Critical: {
    Main: '#9D0F0F',
    MainHover: '#8D0E0E',
    MainActive: '#850D0D',
    MainLine: '#7E0C0C',
    OnMain: '#FFFFFF',
    Container: '#E7C3C3',
    ContainerHover: '#E2B7B7',
    ContainerActive: '#DDABAB',
    ContainerLine: '#D89F9F',
    OnContainer: '#6E0B0B',
  },

  Other: {
    FocusRing: 'rgba(0 0 0 / 50%)',
    Shadow: 'rgba(0 0 0 / 20%)',
    Overlay: 'rgba(0 0 0 / 50%)',
  },
});

// The /app shell's palette: pale blue-grey page background, white cards,
// slate ink and a sky-blue accent. This is the default light theme, so the
// rest of the client (rooms, settings, auth) matches the /app chrome.
export const appLightTheme = createTheme(color, {
  Background: {
    Container: '#DCE7EC',
    ContainerHover: '#D0DEE5',
    ContainerActive: '#C5D5DE',
    ContainerLine: '#CDD9DF',
    OnContainer: '#1E2A32',
  },

  Surface: {
    Container: '#FFFFFF',
    ContainerHover: '#F1F6F9',
    ContainerActive: '#E7EFF3',
    ContainerLine: '#E2E9EE',
    OnContainer: '#1E2A32',
  },

  SurfaceVariant: {
    Container: '#EEF4F7',
    ContainerHover: '#E2ECF1',
    ContainerActive: '#D7E4EB',
    ContainerLine: '#CDD9DF',
    OnContainer: '#1E2A32',
  },

  Primary: {
    Main: '#1596CE',
    MainHover: '#1387B9',
    MainActive: '#127FAE',
    MainLine: '#1177A3',
    OnMain: '#FFFFFF',
    Container: '#D7ECF6',
    ContainerHover: '#CAE5F2',
    ContainerActive: '#BDDFEE',
    ContainerLine: '#9FD3EA',
    OnContainer: '#0F6D9C',
  },

  Secondary: {
    Main: '#1E2A32',
    MainHover: '#2B3A43',
    MainActive: '#36464F',
    MainLine: '#41525C',
    OnMain: '#FFFFFF',
    Container: '#E2E9EE',
    ContainerHover: '#D6E0E6',
    ContainerActive: '#CAD6DD',
    ContainerLine: '#BDCBD3',
    OnContainer: '#2B3A43',
  },

  Success: {
    Main: '#2E7D32',
    MainHover: '#29712D',
    MainActive: '#276A2B',
    MainLine: '#246428',
    OnMain: '#FFFFFF',
    Container: '#E3F1E4',
    ContainerHover: '#D7EBD8',
    ContainerActive: '#CBE4CC',
    ContainerLine: '#BEDEC0',
    OnContainer: '#1F5822',
  },

  Warning: {
    Main: '#8A6A1F',
    MainHover: '#7C5F1C',
    MainActive: '#755A1A',
    MainLine: '#6E5419',
    OnMain: '#FFFFFF',
    Container: '#FAF1DC',
    ContainerHover: '#F7EBCD',
    ContainerActive: '#F4E4BE',
    ContainerLine: '#F0D9A8',
    OnContainer: '#614A16',
  },

  Critical: {
    Main: '#D64545',
    MainHover: '#C93D3D',
    MainActive: '#BF3A3A',
    MainLine: '#B53737',
    OnMain: '#FFFFFF',
    Container: '#FBE9E9',
    ContainerHover: '#F8DDDD',
    ContainerActive: '#F5D1D1',
    ContainerLine: '#F0C3C3',
    OnContainer: '#A32F2F',
  },

  Other: {
    FocusRing: 'rgba(21, 150, 206, 0.5)',
    Shadow: 'rgba(30, 42, 50, 0.18)',
    Overlay: 'rgba(20, 30, 36, 0.45)',
  },
});

// Dark counterpart of the /app palette: the same blue-slate hue family and
// sky-blue accent, inverted for low light.
const darkThemeData = {
  Background: {
    Container: '#141C21',
    ContainerHover: '#1D272E',
    ContainerActive: '#26323A',
    ContainerLine: '#2F3C45',
    OnContainer: '#EEF4F7',
  },

  Surface: {
    Container: '#1D272E',
    ContainerHover: '#26323A',
    ContainerActive: '#2F3C45',
    ContainerLine: '#384751',
    OnContainer: '#EEF4F7',
  },

  SurfaceVariant: {
    Container: '#26323A',
    ContainerHover: '#2F3C45',
    ContainerActive: '#384751',
    ContainerLine: '#42525D',
    OnContainer: '#EEF4F7',
  },

  Primary: {
    Main: '#6CC4EA',
    MainHover: '#5BBDE7',
    MainActive: '#52B9E6',
    MainLine: '#49B5E4',
    OnMain: '#0B3A52',
    Container: '#0F4A69',
    ContainerHover: '#115374',
    ContainerActive: '#135B80',
    ContainerLine: '#15648C',
    OnContainer: '#D7ECF6',
  },

  Secondary: {
    Main: '#FFFFFF',
    MainHover: '#E2E9EE',
    MainActive: '#D6E0E6',
    MainLine: '#CAD6DD',
    OnMain: '#141C21',
    Container: '#384751',
    ContainerHover: '#42525D',
    ContainerActive: '#4C5D68',
    ContainerLine: '#566873',
    OnContainer: '#EEF4F7',
  },

  Success: {
    Main: '#85E0BA',
    MainHover: '#70DBAF',
    MainActive: '#66D9A9',
    MainLine: '#5CD6A3',
    OnMain: '#0F3D2A',
    Container: '#175C3F',
    ContainerHover: '#1A6646',
    ContainerActive: '#1C704D',
    ContainerLine: '#1F7A54',
    OnContainer: '#CCF2E2',
  },

  Warning: {
    Main: '#E3BA91',
    MainHover: '#DFAF7E',
    MainActive: '#DDA975',
    MainLine: '#DAA36C',
    OnMain: '#3F2A15',
    Container: '#5E3F20',
    ContainerHover: '#694624',
    ContainerActive: '#734D27',
    ContainerLine: '#7D542B',
    OnContainer: '#F3E2D1',
  },

  Critical: {
    Main: '#E69D9D',
    MainHover: '#E28D8D',
    MainActive: '#E08585',
    MainLine: '#DE7D7D',
    OnMain: '#401C1C',
    Container: '#602929',
    ContainerHover: '#6B2E2E',
    ContainerActive: '#763333',
    ContainerLine: '#803737',
    OnContainer: '#F5D6D6',
  },

  Other: {
    FocusRing: 'rgba(108, 196, 234, 0.5)',
    Shadow: 'rgba(0, 0, 0, 1)',
    Overlay: 'rgba(8, 12, 15, 0.8)',
  },
};

export const darkTheme = createTheme(color, darkThemeData);

export const butterTheme = createTheme(color, {
  ...darkThemeData,
  Background: {
    Container: '#1A1916',
    ContainerHover: '#262621',
    ContainerActive: '#33322C',
    ContainerLine: '#403F38',
    OnContainer: '#FFFBDE',
  },

  Surface: {
    Container: '#262621',
    ContainerHover: '#33322C',
    ContainerActive: '#403F38',
    ContainerLine: '#4D4B43',
    OnContainer: '#FFFBDE',
  },

  SurfaceVariant: {
    Container: '#33322C',
    ContainerHover: '#403F38',
    ContainerActive: '#4D4B43',
    ContainerLine: '#59584E',
    OnContainer: '#FFFBDE',
  },

  Secondary: {
    Main: '#FFFBDE',
    MainHover: '#E5E2C8',
    MainActive: '#D9D5BD',
    MainLine: '#CCC9B2',
    OnMain: '#1A1916',
    Container: '#403F38',
    ContainerHover: '#4D4B43',
    ContainerActive: '#59584E',
    ContainerLine: '#666459',
    OnContainer: '#F2EED3',
  },
});
