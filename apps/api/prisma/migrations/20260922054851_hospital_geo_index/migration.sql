-- Speeds up geo-search (see ARCHITECTURE.md "Geo-search"): earth_box()
-- narrows candidates using this index before earth_distance() computes
-- exact distance, so nearest-hospital queries stay fast as data grows.
CREATE INDEX IF NOT EXISTS hospital_geo_idx ON hospitals USING gist (ll_to_earth(lat, lng));
