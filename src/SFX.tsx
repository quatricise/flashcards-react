import { randomIntFromTo } from "./GlobalFunctions"

export const Sounds = {
  drink_up:       "drink_up.wav",
  team_change_1:  "team_change_1.wav",
  team_change_2:  "team_change_2.wav",
  team_change_3:  "team_change_3.wav",
  team_change_4:  "team_change_4.wav",
  card_flip:      "card_flip.wav",
  card_return:    "card_return.ogg",
  card_throw:     "card_throw.ogg",
  failure_1:      "failure_1.ogg",
  failure_2:      "failure_2.ogg",
  failure_3:      "failure_3.ogg",
  success_1:      "success_1.ogg",
  success_2:      "success_2.ogg",
}

export function playSound(name: (keyof typeof Sounds)) {
  const audio = new Audio(`./sound/${Sounds[name]}`)
  audio.play()
}

export function playSoundRandom(from: (keyof typeof Sounds)[]) {
  playSound(from[randomIntFromTo(0, from.length - 1)])
}