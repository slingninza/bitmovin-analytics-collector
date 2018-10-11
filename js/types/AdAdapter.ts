export interface AdAdapter {
  isLinearAdActive: () => boolean;
  getContainer: () => HTMLElement;
  getAdModule: () => string;
}