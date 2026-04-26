'use client';

import { useState } from 'react';
import {
  buildCommercialActionQueue,
  CommercialAction,
  ActionState,
} from '../../lib/source/source-commercial-action-queue';

export interface SourceCommercialActionQueueProps {
  rfpId: string;
  vendorList: string[];
}

// AbarVa design tokens
const tokens = {
  bg: '#FAFAF9',
  bgWhite: '#FFFFFF',
  border: '#E8E6E3',
  textPrimary: '#171412',
  textMuted: '#6B6560',
  accent: '#1E3A5F',
  accentLight: '#2E6FD8',
};

const stateChipStyle = (state: ActionState): React.CSSProperties => {
  const map: Record<ActionState, string> = {
    proposed: '#DCFCE7',
    waiting: '#FEF9C3',
    blocked: '#FEE2E2',
    completed: '#F1F5F9',
    deferred: '#F1F5F9',
  };
  return {
    backgroundColor: map[state],
    color: tokens.textPrimary,
    fontSize: '11px',
    fontWeight: 500,
    padding: '2px 7px',
    borderRadius: '4px',
    whiteSpace: 'nowrap' as const,
    fontFamily: 'DM Sans, sans-serif',
  };
};

const priorityDot = (priority: 'high' | 'medium' | 'low'): React.CSSProperties => {
  const color = priority === 'high' ? '#DC2626' : priority === 'medium' ? '#D97706' : '#9CA3AF';
  return {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
    display: 'inline-block',
  };
};

function ActionRow({
  action,
  expanded,
  onToggle,
}: {
  action: CommercialAction;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        borderBottom: `1px solid ${tokens.border}`,
        padding: '10px 14px',
        backgroundColor: tokens.bgWhite,
      }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Priority dot */}
        <span style={priorityDot(action.priority)} />

        {/* Category chip */}
        <span
          style={{
            backgroundColor: '#F1F5F9',
            color: tokens.textPrimary,
            fontSize: '11px',
            fontWeight: 500,
            padding: '2px 7px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {action.category}
        </span>

        {/* Agent owner badge */}
        <span
          style={{
            backgroundColor: '#DBEAFE',
            color: tokens.accent,
            fontSize: '11px',
            fontWeight: 500,
            padding: '2px 7px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {action.agentOwner}
        </span>

        {/* Label */}
        <span
          style={{
            flex: 1,
            fontSize: '13px',
            color: tokens.textPrimary,
            fontFamily: 'DM Sans, sans-serif',
            minWidth: '160px',
          }}
        >
          {action.label}
        </span>

        {/* State chip */}
        <span style={stateChipStyle(action.state)}>{action.state}</span>

        {/* Expand toggle */}
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: tokens.accentLight,
            fontSize: '11px',
            padding: '0 2px',
            fontFamily: 'DM Sans, sans-serif',
            flexShrink: 0,
          }}
          aria-label={expanded ? 'Collapse stop condition' : 'Expand stop condition'}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Stop condition (expanded) */}
      {expanded && (
        <div
          style={{
            marginTop: '6px',
            padding: '7px 10px',
            backgroundColor: '#F8F7F4',
            borderRadius: '4px',
            borderLeft: `3px solid ${tokens.border}`,
          }}
        >
          <span
            style={{
              fontSize: '11px',
              color: tokens.textMuted,
              fontFamily: 'DM Sans, sans-serif',
              display: 'block',
              marginBottom: '2px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Stop condition
          </span>
          <span
            style={{
              fontSize: '12px',
              color: tokens.textPrimary,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {action.stopCondition}
          </span>
          <div style={{ marginTop: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                color: tokens.textMuted,
                fontFamily: 'DM Sans, sans-serif',
                display: 'block',
                marginBottom: '2px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Source basis
            </span>
            <span
              style={{
                fontSize: '12px',
                color: tokens.textPrimary,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {action.sourceBasis}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function SourceCommercialActionQueue({
  rfpId,
  vendorList,
}: SourceCommercialActionQueueProps) {
  const vm = buildCommercialActionQueue(rfpId, vendorList);
  const [showMore, setShowMore] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const displayedActions = showMore ? vm.actions : vm.visibleActions;

  const toggleExpand = (actionId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  };

  return (
    <div
      style={{
        backgroundColor: tokens.bg,
        border: `1px solid ${tokens.border}`,
        borderRadius: '6px',
        overflow: 'hidden',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: `1px solid ${tokens.border}`,
          backgroundColor: tokens.bgWhite,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: tokens.textPrimary,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Action Queue
        </span>

        {/* Stats row */}
        <span
          style={{
            fontSize: '12px',
            color: tokens.textMuted,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {vm.totalCount} actions
        </span>

        {vm.highPriorityCount > 0 && (
          <span
            style={{
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {vm.highPriorityCount} high priority
          </span>
        )}

        {vm.blockedCount > 0 && (
          <span
            style={{
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {vm.blockedCount} blocked
          </span>
        )}
      </div>

      {/* Action list */}
      <div>
        {displayedActions.map((action) => (
          <ActionRow
            key={action.actionId}
            action={action}
            expanded={expandedIds.has(action.actionId)}
            onToggle={() => toggleExpand(action.actionId)}
          />
        ))}
      </div>

      {/* Show more toggle */}
      {vm.hasMore && (
        <div
          style={{
            padding: '10px 14px',
            borderTop: `1px solid ${tokens.border}`,
            backgroundColor: tokens.bgWhite,
          }}
        >
          <button
            onClick={() => setShowMore((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: tokens.accentLight,
              fontSize: '12px',
              fontWeight: 500,
              padding: 0,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {showMore
              ? `Show less`
              : `Show ${vm.totalCount - vm.visibleActions.length} more`}
          </button>
        </div>
      )}

      {/* Caveat footer */}
      <div
        style={{
          padding: '8px 14px',
          borderTop: `1px solid ${tokens.border}`,
          backgroundColor: '#F8F7F4',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            color: tokens.textMuted,
            fontFamily: 'DM Sans, sans-serif',
            fontStyle: 'italic',
          }}
        >
          {vm.caveat}
        </span>
      </div>
    </div>
  );
}
