import { EventEmitter } from 'events';

export const adminEvents = new EventEmitter();

export const ADMIN_EVENT_TYPES = {
    AUDIT_LOG_CREATED: 'audit_log:created',
    STATS_UPDATED: 'stats:updated',
};
