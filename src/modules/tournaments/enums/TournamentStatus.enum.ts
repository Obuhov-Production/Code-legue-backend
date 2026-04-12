export enum TournamentStatus {
    DRAFT        = 'draft',
    REGISTRATION = 'registration',
    RUNNING      = 'running',
    FINISHED     = 'finished',
    CANCELLED    = 'cancelled',
}

/** Allowed transitions: from → allowed next statuses */
export const STATUS_TRANSITIONS: Record<TournamentStatus, TournamentStatus[]> = {
    [TournamentStatus.DRAFT]:        [TournamentStatus.REGISTRATION, TournamentStatus.CANCELLED],
    [TournamentStatus.REGISTRATION]: [TournamentStatus.RUNNING, TournamentStatus.DRAFT, TournamentStatus.CANCELLED],
    [TournamentStatus.RUNNING]:      [TournamentStatus.FINISHED, TournamentStatus.CANCELLED],
    [TournamentStatus.FINISHED]:     [],
    [TournamentStatus.CANCELLED]:    [TournamentStatus.DRAFT],
};
