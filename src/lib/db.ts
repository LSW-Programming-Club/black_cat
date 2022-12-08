import type { Game } from './classes'
export const games: Game[] = []
export const classes: string[] = ['Scout', 'Antivirus', 'Firewall']
export const actions: { [key: string]: string[] } = {
  Scout: ['detect'],
  Antivirus: ['disinfect'],
  Firewall: ['purge', 'smash']
}
