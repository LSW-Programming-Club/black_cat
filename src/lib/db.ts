import type { Game } from './classes'
export const games: Game[] = []
export const classes: string[] = ['Scout', 'Antivirus', 'Firewall']
export const actions: { [key: string]: string[] } = {
  scout: ['move', 'detect'],
  antivirus: ['move', 'disinfect'],
  firewall: ['move', 'purge', 'smash']
}
