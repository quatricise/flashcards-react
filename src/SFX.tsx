
const Sounds = {
  drink_up: "drink_up.wav",
  team_change: "team_change.wav",
  card_flip: "card_flip.wav",
}

export function playSound(name: (keyof typeof Sounds)) {
  const audio = new Audio(`./sound/${Sounds[name]}`)
  audio.play()
}