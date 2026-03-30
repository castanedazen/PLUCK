let supply = []
let shortages = []

export function addSupply(item) {
  supply.push(item)
  return item
}

export function getSupply() {
  return supply
}

export function addShortage(item) {
  shortages.push(item)
  return item
}

export function getShortages() {
  return shortages
}