export enum StrategyType {
  VAST= 'vast',
  VPAID= 'vpaid',
  IMA = 'ima'
}

export const mapStringToStrategyType = (text: string) => {
  return StrategyType[text.toUpperCase()]
}
