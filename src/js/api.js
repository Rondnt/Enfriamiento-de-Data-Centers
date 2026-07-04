/**
 * api.js
 * Cliente HTTP para el backend REST.
 */

const BASE = '/api';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

export const api = {
  servers: {
    list:    ()              => request('GET',    '/servers'),
    get:     (id)            => request('GET',    `/servers/${id}`),
    create:  (data)          => request('POST',   '/servers', data),
    update:  (id, data)      => request('PUT',    `/servers/${id}`, data),
    updateK: (id, kValue)    => request('PATCH',  `/servers/${id}/k`, { k_value: kValue }),
    delete:  (id)            => request('DELETE', `/servers/${id}`),
  },
  readings: {
    list:   (serverId)                  => request('GET',    `/servers/${serverId}/readings`),
    add:    (serverId, temp, tMinutes)  => request('POST',   `/servers/${serverId}/readings`, { temperature: temp, t_minutes: tMinutes ?? null }),
    delete: (serverId, id)              => request('DELETE', `/servers/${serverId}/readings/${id}`),
  },
  scenarios: {
    list:   ()     => request('GET',    '/scenarios'),
    create: (data) => request('POST',   '/scenarios', data),
    delete: (id)   => request('DELETE', `/scenarios/${id}`),
  },
};
