/**
 * solver.js
 * Métodos de resolución para la Ley de Enfriamiento de Newton:
 *   dT/dt = -k * (T - Tamb)
 */

/**
 * Derivada del modelo: f(t, T) = -k * (T - Tamb)
 */
function dTdt(T, k, Tamb) {
  return -k * (T - Tamb);
}

/**
 * Solución analítica exacta.
 * T(t) = Tamb + (T0 - Tamb) * e^(-kt)
 * @returns {number[]} arreglo de temperaturas para cada t en times
 */
export function solveAnalytical({ T0, Tamb, k, times }) {
  return times.map(t => Tamb + (T0 - Tamb) * Math.exp(-k * t));
}

/**
 * Método de Euler explícito.
 * T_{n+1} = T_n + h * f(t_n, T_n)
 * @returns {number[]} arreglo de temperaturas aproximadas
 */
export function solveEuler({ T0, Tamb, k, times, h }) {
  const result = [T0];
  let T = T0;
  for (let i = 1; i < times.length; i++) {
    T = T + h * dTdt(T, k, Tamb);
    result.push(T);
  }
  return result;
}

/**
 * Método de Runge-Kutta de orden 4.
 * @returns {number[]} arreglo de temperaturas aproximadas
 */
export function solveRK4({ T0, Tamb, k, times, h }) {
  const result = [T0];
  let T = T0;
  for (let i = 1; i < times.length; i++) {
    const k1 = dTdt(T, k, Tamb);
    const k2 = dTdt(T + (h / 2) * k1, k, Tamb);
    const k3 = dTdt(T + (h / 2) * k2, k, Tamb);
    const k4 = dTdt(T + h * k3, k, Tamb);
    T = T + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    result.push(T);
  }
  return result;
}

/**
 * Genera el arreglo de tiempos desde 0 hasta tmax con paso h.
 * @returns {number[]}
 */
export function buildTimeArray({ tmax, h }) {
  const times = [];
  for (let t = 0; t <= tmax + 1e-9; t = Math.round((t + h) * 1e6) / 1e6) {
    times.push(t);
  }
  return times;
}

/**
 * Calcula el error absoluto entre dos arreglos de temperaturas.
 * @returns {number[]}
 */
export function computeAbsoluteError(reference, approximation) {
  return reference.map((val, i) => Math.abs(val - approximation[i]));
}

/**
 * Tiempo al 50% de enfriamiento: ln(2) / k
 * @returns {number}
 */
export function halfLifeTime(k) {
  return Math.log(2) / k;
}

/**
 * Constante de tiempo τ = 1/k
 * @returns {number}
 */
export function timeConstant(k) {
  return 1 / k;
}

// ── Modelo extendido con generación de calor ──────────────────────────────
// dT/dt = qdot - k*(T - Tamb)   donde qdot = Q/(m·c) en °C/min
// Solución: T(t) = Teq + (T0 - Teq)*e^(-kt)   con Teq = Tamb + qdot/k

/**
 * Temperatura de equilibrio cuando hay generación de calor constante.
 * @returns {number}
 */
export function equilibriumTemp(Tamb, k, qdot) {
  return Tamb + qdot / k;
}

/**
 * Solución analítica del modelo no homogéneo con generación de calor.
 * @returns {number[]}
 */
export function solveAnalyticalWithLoad({ T0, Tamb, k, qdot, times }) {
  const Teq = equilibriumTemp(Tamb, k, qdot);
  return times.map(t => Teq + (T0 - Teq) * Math.exp(-k * t));
}

/**
 * Puntos para el diagrama de fase: {x: T, y: dT/dt}.
 * @returns {{x: number, y: number}[]}
 */
export function buildPhasePoints({ T0, Tamb, k, qdot }) {
  const Tmin = Math.max(5, Tamb - 5);
  const Tmax = T0 + 10;
  return Array.from({ length: 81 }, (_, i) => {
    const T = Tmin + (i / 80) * (Tmax - Tmin);
    return { x: +T.toFixed(2), y: +(qdot - k * (T - Tamb)).toFixed(4) };
  });
}

/**
 * Familia de curvas analíticas para distintos valores de k (análisis de sensibilidad).
 * @returns {{ k, label, color, times, temps }[]}
 */
export function buildSensitivityCurves({ T0, Tamb, tmax, h }, profiles) {
  const times = buildTimeArray({ tmax, h });
  return profiles.map(p => ({
    ...p,
    times,
    temps: solveAnalytical({ T0, Tamb, k: p.k, times }),
  }));
}

/**
 * Error global en función del paso h para un tiempo fijo (análisis de convergencia).
 * Compara Euler y RK4 contra la solución analítica en t = tmax.
 * @returns {{ h, eulerErr, rk4Err }[]}
 */
export function buildConvergenceData({ T0, Tamb, k, tmax }, hValues) {
  return hValues.map(h => {
    const times = buildTimeArray({ tmax, h });
    const exact = solveAnalytical({ T0, Tamb, k, times });
    const euler = solveEuler({ T0, Tamb, k, times, h });
    const rk4 = solveRK4({ T0, Tamb, k, times, h });
    const last = times.length - 1;
    return {
      h,
      eulerErr: Math.abs(exact[last] - euler[last]),
      rk4Err: Math.abs(exact[last] - rk4[last]),
    };
  });
}
