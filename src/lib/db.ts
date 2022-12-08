import type { Game } from './classes'
export const games: Game[] = []
export const classes: string[] = ['Scout', 'Antivirus', 'Firewall']
export const actions: { [key: string]: string[] } = {
  Scout: ['move', 'detect'],
  Antivirus: ['move', 'disinfect'],
  Firewall: ['move', 'purge', 'smash', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'F']
}
