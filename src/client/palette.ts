// Novation's 128-colour palette as the pads show it: sampled from the colour
// palette table in the Launchkey MK4 Programmer's Reference ("Colour palette").
// The chart is how the LEDs look through the pads, softer than the raw values
// the firmware drives them with. 0 is off.
export const PALETTE: readonly string[] = [
  '#000000', '#b3b3b3', '#dddddd', '#ffffff', '#ffb3b3', '#ff6161', '#dd6161', '#b36161',
  '#fff3d5', '#ffb361', '#dd8c61', '#b37661', '#ffeea1', '#ffff61', '#dddd61', '#b3b361',
  '#ddffa1', '#c2ff61', '#a1dd61', '#81b361', '#c2ffb3', '#61ff61', '#61dd61', '#61b361',
  '#c2ffc2', '#61ff8c', '#61dd76', '#61b36b', '#c2ffcc', '#61ffcc', '#61dda1', '#61b381',
  '#c2fff3', '#61ffe9', '#61ddc2', '#61b396', '#c2f3ff', '#61eeff', '#61c7dd', '#61a1b3',
  '#c2ddff', '#61c7ff', '#61a1dd', '#6181b3', '#a18cff', '#6161ff', '#6161dd', '#6161b3',
  '#ccb3ff', '#a161ff', '#8161dd', '#7661b3', '#ffb3ff', '#ff61ff', '#dd61dd', '#b361b3',
  '#ffb3d5', '#ff61c2', '#dd61a1', '#b3618c', '#ff7661', '#e9b361', '#ddc261', '#a1a161',
  '#61b361', '#61b38c', '#618cd5', '#6161ff', '#61b3b3', '#8c61f3', '#ccb3c2', '#8c7681',
  '#ff6161', '#f3ffa1', '#eefc61', '#ccff61', '#76dd61', '#61ffcc', '#61e9ff', '#61a1ff',
  '#8c61ff', '#cc61fc', '#ee8cdd', '#a17661', '#ffa161', '#ddf961', '#d5ff8c', '#61ff61',
  '#b3ffa1', '#ccfcd5', '#b3fff6', '#cce4ff', '#a1c2f6', '#d5c2f9', '#f98cff', '#ff61cc',
  '#ffc261', '#f3ee61', '#e4ff61', '#ddcc61', '#b3a161', '#61ba76', '#76c28c', '#8181a1',
  '#818ccc', '#ccaa81', '#dd6161', '#f9b3a1', '#f9ba76', '#fff38c', '#e9f9a1', '#d5ee76',
  '#8181a1', '#f9f9d5', '#ddfce4', '#e9e9ff', '#e4d5ff', '#b3b3b3', '#d5d5d5', '#f9ffff',
  '#e96161', '#aa6161', '#81f661', '#61b361', '#f3ee61', '#b3a161', '#eec261', '#c27661',
];
