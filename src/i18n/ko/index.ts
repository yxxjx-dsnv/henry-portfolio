// Every page's Korean, keyed by the exact English string. One file per page.
import common from './common';
import home from './home';
import data from './data';
import education from './education';
import essays from './essays';
import colophon from './colophon';
import incheon from './incheon';
import holyBridge from './holy-bridge';
import gyroscopeWand from './gyroscope-wand';
import greenstoneGrind from './greenstone-grind';
import utkesa from './utkesa';
import pendulum from './pendulum';
import campusPulse from './campus-pulse';
import mono from './mono';
import aps105 from './aps105';
import components from './components';

export const KO: Record<string, string> = Object.assign({}, common, home, data, education, essays, colophon, incheon, holyBridge, gyroscopeWand, greenstoneGrind, utkesa, pendulum, campusPulse, mono, aps105, components);
