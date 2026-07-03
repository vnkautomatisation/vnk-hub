"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/toast";
import { StatusBadge } from "@/components/ui/badge";
import { OrderSlidePanel } from "@/components/orders/order-slide-panel";
import { StatusTransitionModal, type TransitionResult } from "@/components/orders/status-transition-modal";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  IconClock, IconAlertTriangle, IconRefresh, IconLayoutColumns, IconTimeline,
} from "@tabler/icons-react";

type LiveOrder = {
  id: string; orderNumber: string; status: string;
  customerName: string; customerEmail?: string; totalAmount: number; currency: string;
  createdAt: string; updatedAt: string; dispatchedAt: string | null;
  store: { name: string };
  assignedTo: { id: string; name: string } | null;
  items: { product: { name: string } }[];
  trackingNumber?: string | null;
};

const COLUMNS: { key: string; label: string; color: string }[] = [
  { key: "PENDING",                label: "En attente",       color: "#F59E0B" },
  { key: "CONFIRMED",              label: "Confirmée",        color: "#6366F1" },
  { key: "DISPATCHED_TO_SUPPLIER", label: "Chez fournisseur", color: "#A78BFA" },
  { key: "SHIPPED",                label: "Expédiée",         color: "#34D399" },
  { key: "IN_TRANSIT",             label: "En transit",       color: "#60A5FA" },
  { key: "DELIVERED",              label: "Livrée",           color: "#4ADE80" },
];

const COL_KEYS = new Set(COLUMNS.map((c) => c.key));

function isBlocked(o: LiveOrder, slaHours: number) {
  if (["DELIVERED", "CANCELLED", "REFUNDED"].includes(o.status)) return false;
  return Date.now() - new Date(o.updatedAt).getTime() > slaHours * 3600 * 1000;
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  } catch { /* blocked autoplay */ }
}

function fmtAge(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}j`;
}

function OrderCard({ order, index, slaHours, onClick }: { order: LiveOrder; index: number; slaHours: number; onClick: (o: LiveOrder) => void }) {
  const blocked = isBlocked(order, slaHours);

  return (
    <Draggable draggableId={order.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(order)}
          style={{
            ...provided.draggableProps.style,
            background: snapshot.isDragging ? "var(--bg-surface)" : "var(--bg-card)",
            border: `0.5px solid ${blocked ? "var(--danger)" : snapshot.isDragging ? "var(--border-strong)" : "var(--border)"}`,
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 8,
            cursor: "grab",
            boxShadow: snapshot.isDragging
              ? "var(--shadow-lg)"
              : blocked ? `0 0 0 2px rgba(248,113,113,0.15)` : "none",
            userSelect: "none",
          }}
        >
          {blocked && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6, padding: "3px 8px", background: "var(--danger-bg)", borderRadius: 6 }}>
              <IconAlertTriangle size={11} style={{ color: "var(--danger)" }} />
              <span style={{ fontSize: 10, color: "var(--danger)", fontWeight: 600 }}>Bloquée +{slaHours}h</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-light)" }}>{order.orderNumber}</span>
            <span style={{ fontSize: 10, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
              <IconClock size={9} /> {fmtAge(order.createdAt)}
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)", marginTop: 4 }}>{order.customerName}</div>
          {order.items[0] && (
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {order.items[0].product.name}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 6, borderTop: "0.5px solid var(--border)" }}>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{order.store.name}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
              {order.totalAmount.toFixed(2)} {order.currency}
            </span>
          </div>
          {order.assignedTo && (
            <div style={{ marginTop: 4, fontSize: 10, color: "var(--text-3)" }}>↳ {order.assignedTo.name}</div>
          )}
        </div>
      )}
    </Draggable>
  );
}

function TimelineView({ orders, slaHours, onCardClick }: { orders: LiveOrder[]; slaHours: number; onCardClick: (o: LiveOrder) => void }) {
  const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const colMap = Object.fromEntries(COLUMNS.map((c) => [c.key, c]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, borderLeft: "2px solid var(--border)", marginLeft: 20 }}>
      {sorted.map((order, i) => {
        const blocked = isBlocked(order, slaHours);
        const col = colMap[order.status];
        const color = col?.color ?? "var(--border-strong)";
        return (
          <div key={order.id} style={{ display: "flex", gap: 16, padding: "8px 0 8px 20px", position: "relative" }}>
            <div style={{
              position: "absolute", left: -5, top: 14, width: 8, height: 8, borderRadius: "50%",
              background: color, border: "2px solid var(--bg-base)",
              boxShadow: i === 0 ? `0 0 0 3px ${color}33` : "none",
            }} />
            <div
              className="card"
              style={{ flex: 1, padding: "10px 14px", cursor: "pointer", transition: "background 120ms", borderColor: blocked ? "var(--danger)" : "var(--border)" }}
              onClick={() => onCardClick(order)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "var(--accent-light)" }}>{order.orderNumber}</span>
                <StatusBadge status={order.status as never} label={col?.label ?? order.status} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>
                {order.customerName} · {order.store.name} · {order.totalAmount.toFixed(2)} {order.currency}
              </div>
              {blocked && (
                <div style={{ marginTop: 5, fontSize: 11, color: "var(--danger)", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                  <IconAlertTriangle size={11} /> Bloquée depuis {fmtAge(order.createdAt)}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {sorted.length === 0 && (
        <div style={{ paddingLeft: 20, fontSize: 13, color: "var(--text-3)", paddingTop: 20 }}>Aucune commande active.</div>
      )}
    </div>
  );
}

export function KanbanBoard({ initialOrders, employees = [], slaHours = 48 }: {
  initialOrders: LiveOrder[];
  employees?: { id: string; name: string }[];
  slaHours?: number;
}) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<LiveOrder[]>(initialOrders);
  const [view, setView] = useState<"kanban" | "timeline">("kanban");
  const [lastCount, setLastCount] = useState(initialOrders.length);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedOrder, setSelectedOrder] = useState<LiveOrder | null>(null);
  const [dragTransition, setDragTransition] = useState<{ order: LiveOrder; toStatus: string } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/orders/live");
      if (!res.ok) return;
      const data: LiveOrder[] = await res.json();
      setLastUpdated(new Date());
      if (data.length > lastCount) {
        beep();
        const diff = data.length - lastCount;
        showToast(`${diff} nouvelle${diff > 1 ? "s" : ""} commande${diff > 1 ? "s" : ""} !`, "success");
      }
      setLastCount(data.length);
      setOrders(data);
    } catch { /* network error */ }
  }, [lastCount, showToast]);

  useEffect(() => {
    intervalRef.current = setInterval(poll, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [poll]);

  function handleStatusChange(id: string, status: string) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    if (selectedOrder?.id === id) {
      setSelectedOrder((prev) => prev ? { ...prev, status } : null);
    }
    // If moved to terminal status, close panel after a beat
    if (status === "CANCELLED" || status === "REFUNDED") {
      setTimeout(() => setSelectedOrder(null), 800);
    }
  }

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    if (newStatus === source.droppableId) return;

    const order = orders.find((o) => o.id === draggableId);
    if (!order) return;

    // Open guided modal — don't touch state yet, modal will confirm
    setDragTransition({ order, toStatus: newStatus });
  }

  function handleDragTransitionSuccess(result: TransitionResult) {
    const order = dragTransition?.order;
    if (!order) return;
    setDragTransition(null);
    setOrders((prev) => prev.map((o) =>
      o.id === order.id
        ? { ...o, status: result.status, trackingNumber: result.trackingNumber ?? o.trackingNumber }
        : o
    ));
    if (selectedOrder?.id === order.id) {
      setSelectedOrder((prev) => prev ? { ...prev, status: result.status } : null);
    }
    const colLabel = COLUMNS.find((c) => c.key === result.status)?.label ?? result.status;
    showToast(`→ ${colLabel}`, "success");
    if (result.status === "CANCELLED" || result.status === "REFUNDED") {
      setTimeout(() => setSelectedOrder(null), 800);
    }
  }

  const activeOrders = orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status));
  const blockedCount = activeOrders.filter((o) => isBlocked(o, slaHours)).length;
  // Orders not shown in any kanban column (terminal)
  const hiddenCount = orders.length - activeOrders.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "var(--success-bg)", borderRadius: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 6px var(--success)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--success)" }}>LIVE</span>
          </div>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>
            Mis à jour {lastUpdated.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-2)" }}>
            {activeOrders.length} commande{activeOrders.length !== 1 ? "s" : ""} actives
          </span>
          {blockedCount > 0 && (
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--danger)", display: "flex", alignItems: "center", gap: 4 }}>
              <IconAlertTriangle size={13} /> {blockedCount} bloquée{blockedCount > 1 ? "s" : ""} +{slaHours}h
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={poll} title="Actualiser">
            <IconRefresh size={14} />
          </button>
          <div style={{ display: "flex", background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 8, padding: 2 }}>
            <button
              className={`btn btn-sm ${view === "kanban" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setView("kanban")}
              style={{ padding: "5px 12px" }}
            >
              <IconLayoutColumns size={13} /> Kanban
            </button>
            <button
              className={`btn btn-sm ${view === "timeline" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setView("timeline")}
              style={{ padding: "5px 12px" }}
            >
              <IconTimeline size={13} /> Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Kanban */}
      {view === "kanban" && (
        <DragDropContext onDragEnd={onDragEnd}>
          {/* Outer wrapper handles horizontal scroll */}
          <div style={{ overflowX: "auto", paddingBottom: 8 }}>
            {/* Flex row — full width, each column grows equally; min-width prevents 1fr collapse that breaks dnd */}
            <div style={{ display: "flex", gap: 12, minWidth: `${COLUMNS.length * 200}px` }}>
              {COLUMNS.map((col) => {
                const colOrders = orders.filter((o) => o.status === col.key);
                return (
                  <div key={col.key} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    {/* Column header */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "7px 10px", marginBottom: 8, borderRadius: 8,
                      background: `${col.color}14`, borderLeft: `3px solid ${col.color}`,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: col.color }}>{col.label}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, minWidth: 20, height: 20, borderRadius: 10,
                        background: col.color, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px",
                      }}>
                        {colOrders.length}
                      </span>
                    </div>

                    {/* Droppable zone */}
                    <Droppable droppableId={col.key}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            flex: 1,
                            minHeight: 200,
                            borderRadius: 10,
                            padding: "4px",
                            background: snapshot.isDraggingOver ? `${col.color}0c` : "transparent",
                            border: snapshot.isDraggingOver
                              ? `1.5px dashed ${col.color}60`
                              : "1.5px dashed transparent",
                            transition: "background 150ms, border-color 150ms",
                          }}
                        >
                          {colOrders.map((order, i) => (
                            <OrderCard key={order.id} order={order} index={i} slaHours={slaHours} onClick={setSelectedOrder} />
                          ))}
                          {provided.placeholder}
                          {colOrders.length === 0 && !snapshot.isDraggingOver && (
                            <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", paddingTop: 24, opacity: 0.5 }}>
                              Vide
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* Timeline */}
      {view === "timeline" && <TimelineView orders={activeOrders} slaHours={slaHours} onCardClick={setSelectedOrder} />}

      {/* Slide panel */}
      {selectedOrder && (
        <OrderSlidePanel
          order={selectedOrder}
          employees={employees}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Drag transition modal */}
      {dragTransition && (
        <StatusTransitionModal
          orderId={dragTransition.order.id}
          orderNumber={dragTransition.order.orderNumber}
          fromStatus={dragTransition.order.status}
          toStatus={dragTransition.toStatus}
          totalAmount={dragTransition.order.totalAmount}
          currency={dragTransition.order.currency}
          onSuccess={handleDragTransitionSuccess}
          onClose={() => setDragTransition(null)}
        />
      )}
    </div>
  );
}
