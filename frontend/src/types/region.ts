/**
 * Region Types
 * Types for provinces and cities
 */

export interface Region {
  id: string;
  name: string;
}

export interface Province extends Region {}

export interface City extends Region {
  province_id: string;
}
