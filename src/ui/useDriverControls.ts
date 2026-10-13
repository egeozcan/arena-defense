import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { DRIVER_LOOK_LIMIT, driverViewPitch, neutralDriverInput } from '../sim/vehicle-pilot';

interface Options {
  vehicleId: number | null;
  canSwitchSide: boolean;
  enabled: boolean;
  paused: boolean;
  surface: RefObject<HTMLDivElement | null>;
  onPause: (paused: boolean) => void;
  onExit: () => void;
  onNext: () => void;
  onAbility: () => void;
  onBoost: () => void;
}

export function useDriverControls(options: Options) {
  const input = useRef(neutralDriverInput());
  const focus = useRef(false);
  const keys = useRef(new Set<string>());
  const latest = useRef(options);
  latest.current = options;
  const [locked, setLocked] = useState(false);
  const [lockUnavailable, setLockUnavailable] = useState(false);
  const intentionalUnlock = useRef(false);

  const clear = useCallback(() => {
    keys.current.clear();
    input.current.throttle = input.current.steer = 0;
    input.current.brake = input.current.fire = false;
    focus.current = false;
  }, []);

  const switchSide = useCallback(() => {
    const o = latest.current;
    if (!o.enabled || o.paused || !o.canSwitchSide) return;
    input.current.side = input.current.side === 'rear' ? 'front' : 'rear';
    input.current.yaw = 0;
    input.current.pitch = driverViewPitch(input.current.side);
    input.current.fire = false;
  }, []);

  const releaseMouse = useCallback(() => {
    intentionalUnlock.current = true;
    if (document.pointerLockElement) document.exitPointerLock();
    setLocked(false);
    clear();
  }, [clear]);

  const requestMouse = useCallback(() => {
    const surface = latest.current.surface.current;
    if (!surface) return;
    if (document.pointerLockElement === surface) return;
    intentionalUnlock.current = false;
    setLockUnavailable(false);
    // Calling in the entry/resume click preserves the browser's user gesture.
    try {
      const request = surface.requestPointerLock?.();
      if (!surface.requestPointerLock) setLockUnavailable(true);
      if (request) void request.catch(() => setLockUnavailable(true));
    } catch {
      setLockUnavailable(true);
    }
  }, []);

  useEffect(() => {
    clear();
    input.current = neutralDriverInput();
  }, [options.vehicleId, clear]);

  useEffect(() => {
    if (options.paused || !options.enabled) releaseMouse();
  }, [options.paused, options.enabled, releaseMouse]);

  useEffect(() => {
    if (!options.enabled) return;
    setLocked(document.pointerLockElement === options.surface.current);
    let dragging = false;
    const drivingKeys = new Set([
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Space',
      'ShiftLeft',
      'ShiftRight',
      'KeyF',
      'KeyP',
      'Escape',
      'Tab',
      'KeyE',
      'KeyQ',
      'KeyR',
      'KeyC',
    ]);
    function sync() {
      const held = (a: string, b?: string) => keys.current.has(a) || (!!b && keys.current.has(b));
      input.current.throttle = Number(held('KeyW', 'ArrowUp')) - Number(held('KeyS', 'ArrowDown'));
      // Our models face +Z; screen-right from the driver's seat is local -X.
      input.current.steer = Number(held('KeyA', 'ArrowLeft')) - Number(held('KeyD', 'ArrowRight'));
      input.current.brake = held('Space');
      focus.current = held('ShiftLeft', 'ShiftRight');
    }
    function keydown(e: KeyboardEvent) {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        (e.target instanceof Element &&
          e.target.closest('input, select, textarea, [contenteditable="true"]'))
      )
        return;
      if (!drivingKeys.has(e.code)) return;
      const o = latest.current;
      // The pause menu keeps normal keyboard navigation and button activation.
      if (o.paused && !['KeyP', 'Escape', 'KeyF'].includes(e.code)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat) return;
      if (e.code === 'KeyF') {
        clear();
        o.onExit();
        return;
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        clear();
        o.onPause(!o.paused);
        if (o.paused) requestMouse();
        return;
      }
      if (o.paused) return;
      if (e.code === 'KeyC') {
        switchSide();
        return;
      }
      if (e.code === 'Tab') {
        clear();
        o.onNext();
        return;
      }
      if (e.code === 'KeyE') {
        o.onAbility();
        return;
      }
      if (e.code === 'KeyQ') {
        o.onBoost();
        return;
      }
      if (e.code === 'KeyR') {
        input.current.yaw = 0;
        input.current.pitch = driverViewPitch(input.current.side);
        return;
      }
      keys.current.add(e.code);
      sync();
    }
    function keyup(e: KeyboardEvent) {
      if (!drivingKeys.has(e.code)) return;
      keys.current.delete(e.code);
      sync();
    }
    function mousemove(e: MouseEvent) {
      if (latest.current.paused || (!document.pointerLockElement && !dragging)) return;
      const sensitivity = focus.current ? 0.0012 : 0.0025;
      input.current.yaw = Math.max(
        -DRIVER_LOOK_LIMIT,
        Math.min(DRIVER_LOOK_LIMIT, input.current.yaw - e.movementX * sensitivity),
      );
      input.current.pitch = Math.max(
        -1.15,
        Math.min(1.25, input.current.pitch - e.movementY * sensitivity),
      );
    }
    function mousedown(e: MouseEvent) {
      if (
        latest.current.paused ||
        !(e.target instanceof Node) ||
        !latest.current.surface.current?.contains(e.target)
      )
        return;
      if (e.button === 0) {
        if (!document.pointerLockElement && !lockUnavailable) requestMouse();
        input.current.fire = true;
      }
      if (e.button === 2) {
        dragging = true;
        e.preventDefault();
      }
    }
    function mouseup(e: MouseEvent) {
      if (e.button === 0) input.current.fire = false;
      if (e.button === 2) dragging = false;
    }
    function lockChange() {
      const isLocked = document.pointerLockElement === latest.current.surface.current;
      setLocked(isLocked);
      if (!isLocked) {
        clear();
        dragging = false;
        if (!intentionalUnlock.current && latest.current.enabled && !latest.current.paused)
          latest.current.onPause(true);
      }
      intentionalUnlock.current = false;
    }
    function lockError() {
      setLockUnavailable(true);
    }
    function blur() {
      dragging = false;
      clear();
      if (!latest.current.paused) latest.current.onPause(true);
    }
    function visibility() {
      if (document.hidden) blur();
    }
    function contextmenu(e: MouseEvent) {
      e.preventDefault();
    }
    const surface = options.surface.current;
    window.addEventListener('keydown', keydown, true);
    window.addEventListener('keyup', keyup, true);
    window.addEventListener('mousemove', mousemove);
    window.addEventListener('mousedown', mousedown);
    window.addEventListener('mouseup', mouseup);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('pointerlockchange', lockChange);
    document.addEventListener('pointerlockerror', lockError);
    surface?.addEventListener('contextmenu', contextmenu);
    return () => {
      clear();
      window.removeEventListener('keydown', keydown, true);
      window.removeEventListener('keyup', keyup, true);
      window.removeEventListener('mousemove', mousemove);
      window.removeEventListener('mousedown', mousedown);
      window.removeEventListener('mouseup', mouseup);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('pointerlockchange', lockChange);
      document.removeEventListener('pointerlockerror', lockError);
      surface?.removeEventListener('contextmenu', contextmenu);
    };
  }, [options.enabled, options.surface, lockUnavailable, clear, requestMouse, switchSide]);

  return { input, focus, locked, lockUnavailable, requestMouse, releaseMouse, clear, switchSide };
}
