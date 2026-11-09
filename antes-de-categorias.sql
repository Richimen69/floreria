--
-- PostgreSQL database dump
--

\restrict aqGu5j69zbwIvK8HYfqdHs30GU3warS9Uc63XwI2t9orjO4oDdktR6zqKdZdQvS

-- Dumped from database version 17.11 (Debian 17.11-1.pgdg13+2)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: postgres
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: postgres
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: postgres
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account (
    id text NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id text NOT NULL,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp with time zone,
    refresh_token_expires_at timestamp with time zone,
    scope text,
    password text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.account OWNER TO postgres;

--
-- Name: ajustes_sitio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ajustes_sitio (
    id integer DEFAULT 1 NOT NULL,
    nombre text DEFAULT 'Florería'::text NOT NULL,
    eslogan text,
    logo_url text,
    color_primario text DEFAULT '#be185d'::text NOT NULL,
    titulo_portada text,
    texto_portada text,
    imagen_portada_url text,
    quienes_somos text,
    whatsapp text,
    telefono text,
    email text,
    direccion text,
    mapa_url text,
    horario text,
    facebook_url text,
    instagram_url text,
    tiktok_url text,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    color_acento text DEFAULT '#6b8f71'::text NOT NULL,
    color_fondo text DEFAULT '#faf7f5'::text NOT NULL,
    latitud double precision,
    longitud double precision,
    CONSTRAINT ajustes_una_sola_fila CHECK ((id = 1))
);


ALTER TABLE public.ajustes_sitio OWNER TO postgres;

--
-- Name: categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias (
    id integer NOT NULL,
    nombre text NOT NULL,
    slug text NOT NULL,
    descripcion text,
    imagen_url text,
    orden integer DEFAULT 0 NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categorias OWNER TO postgres;

--
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_id_seq OWNER TO postgres;

--
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- Name: productos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    categoria_id integer NOT NULL,
    nombre text NOT NULL,
    slug text NOT NULL,
    descripcion text,
    precio_centavos integer NOT NULL,
    precio_oferta_centavos integer,
    imagenes text[] DEFAULT '{}'::text[] NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    disponible boolean DEFAULT true NOT NULL,
    destacado boolean DEFAULT false NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.productos OWNER TO postgres;

--
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_seq OWNER TO postgres;

--
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    id text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    token text NOT NULL,
    ip_address text,
    user_agent text,
    user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.session OWNER TO postgres;

--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    image text,
    role text DEFAULT 'cliente'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: verification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.verification OWNER TO postgres;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgres
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	39878eee189d071539ad429a89c14a10315244e53335afae34f9d2f60b712417	1793898330642
2	f21afbb90a53b4a3f6cd46db3fa9381972e765b728a949e4cb98ad4571d711ed	1793900658372
3	f31934227655fa432166b82f4f458529a845d19de3ed1d342e01bc76ea6090a2	1793901693870
4	ff0d5fc57def78830c05db6b2b25c9193db9a3382e83da2911d1641799552941	1793902479158
5	ea1ca12b099709a3c371fff41f712b61a0751f4f636d702a7daa009c29d5f775	1793904736855
\.


--
-- Data for Name: account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at) FROM stdin;
c84bdcbd-a7a8-4bac-85f4-076fb4aa77a3	97805a7d-9f28-47c2-9517-aaa00f24a902	credential	97805a7d-9f28-47c2-9517-aaa00f24a902	\N	\N	\N	\N	\N	\N	638d701cbd4056942f5b04f017dbfb02:3e448b425fe919522f420b06eae33e05e81a7741d4dbb4420168cd7c4e8505ece065db1384eba56323f5d47bc1582d15788762cb52fa1a30378d585bf67c3cbb	2026-11-08 23:30:25.75323+00	2026-11-08 23:30:25.75323+00
\.


--
-- Data for Name: ajustes_sitio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ajustes_sitio (id, nombre, eslogan, logo_url, color_primario, titulo_portada, texto_portada, imagen_portada_url, quienes_somos, whatsapp, telefono, email, direccion, mapa_url, horario, facebook_url, instagram_url, tiktok_url, actualizado_en, color_acento, color_fondo, latitud, longitud) FROM stdin;
1	Florería	\N	\N	#be185d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-11-08 23:30:03.764674+00	#6b8f71	#faf7f5	\N	\N
\.


--
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias (id, nombre, slug, descripcion, imagen_url, orden, activa, creado_en, actualizado_en) FROM stdin;
2	CUMPLEAÑOS	cumpleanos	\N	\N	0	t	2026-11-08 23:33:35.773062+00	2026-11-08 23:33:35.773062+00
1	BONITO DÍA - MENOS DE $1,000	bonito-dia	\N	\N	0	t	2026-11-08 23:33:20.599048+00	2026-11-09 02:22:51.23+00
\.


--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos (id, categoria_id, nombre, slug, descripcion, precio_centavos, precio_oferta_centavos, imagenes, activo, disponible, destacado, orden, creado_en, actualizado_en) FROM stdin;
1	1	BOUQUET CHICO - 2 ROSAS + 1 GERBERA	bonito-003	Incluye: 2 Rosas, 1 Gerbera, flores complementarias y follajes, envoltorio premium, alimento para flores, tarjeta y sobre María Bonita. Altura aproximada: 30 cm. Indica el color de las rosas y del envoltorio al realizar el pedido. Sujeto a disponibilidad.	29900	\N	{https://pub-1693e7c27ad447449e2e518e5f4d7e29.r2.dev/productos/e77d7e10-38bf-4e65-bbba-7aa0571eddc4.webp}	t	t	t	0	2026-11-08 23:34:18.331107+00	2026-11-08 23:34:18.331107+00
2	1	BOUQUET CHICO - 4 GERBERITAS	bonito-005	Incluye: 4 gerberas, alstroemerias y follajes variados, envoltorio premium, alimento para flores, tarjeta y sobre María Bonita. Altura aproximada: 35 cm. Los colores de las gerberas y del envoltorio pueden variar según disponibilidad.	49900	\N	{https://pub-1693e7c27ad447449e2e518e5f4d7e29.r2.dev/productos/21a5e0ef-77e5-4710-9485-8c171a11c939.webp}	t	t	f	0	2026-11-08 23:34:56.118022+00	2026-11-08 23:34:56.118022+00
3	1	BOUQUET CHICO - 6 ROSAS Y ALSTROEMERIAS	bonito-014	Incluye: 6 rosas, alstroemerias y follajes, envoltorio premium, alimento para flores, tarjeta y sobre María Bonita. Largo aproximado: 35 cm. Indica el color de las rosas y del envoltorio al realizar el pedido. Sujeto a disponibilidad.	49900	\N	{https://pub-1693e7c27ad447449e2e518e5f4d7e29.r2.dev/productos/d412f52f-5797-472a-a8a6-1202ad9a0f7d.webp}	t	t	f	0	2026-11-08 23:35:44.077537+00	2026-11-08 23:35:44.077537+00
4	2	12 ROSAS MIXTAS	cumple-004	12 rosas mixtas acompañadas de alstroemerias, gypso y eucalipto dólar, con envoltura decorativa y moño. Un detalle lleno de color para celebrar su día. Largo aproximado: 45 cm.	89900	\N	{https://pub-1693e7c27ad447449e2e518e5f4d7e29.r2.dev/productos/00a3ae67-2500-4139-a11e-eb4c22c83f62.webp,https://pub-1693e7c27ad447449e2e518e5f4d7e29.r2.dev/productos/e076c1a2-717b-4bcf-ab16-45cf1818b689.webp}	t	t	f	0	2026-11-09 02:15:24.275668+00	2026-11-09 02:15:24.275668+00
5	2	JARRÓN XL · GRAN CELEBRACIÓN	cumple-016	Celebra con 50 rosas mixtas, acompañadas de snapdragon, alstroemerias, gypso y eucalipto dólar. Presentadas en jarrón de cristal XL con moño decorativo. Altura aproximada: 65 cm.	239000	\N	{https://pub-1693e7c27ad447449e2e518e5f4d7e29.r2.dev/productos/15b94f80-91a0-41f9-b2c2-4b8665633775.webp,https://pub-1693e7c27ad447449e2e518e5f4d7e29.r2.dev/productos/ed7f4f0a-c48d-419d-9529-4bbc55738a36.webp,https://pub-1693e7c27ad447449e2e518e5f4d7e29.r2.dev/productos/b839dfa8-87c0-4ba8-acd4-3be09f2322a3.webp}	t	t	f	0	2026-11-09 02:16:42.007931+00	2026-11-09 02:16:42.007931+00
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session (id, expires_at, token, ip_address, user_agent, user_id, created_at, updated_at) FROM stdin;
cU23C8lgajJzZMwQpj8wfSEA88NcMWrr	2026-11-15 23:30:54.881+00	5vIoyqxgFTBlrzI7ms0fYe34Cg6EfHEV	0000:0000:0000:0000:0000:0000:0000:0000	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 OPR/138.0.0.0	97805a7d-9f28-47c2-9517-aaa00f24a902	2026-11-08 23:30:54.881+00	2026-11-08 23:30:54.882+00
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (id, name, email, email_verified, image, role, created_at, updated_at) FROM stdin;
97805a7d-9f28-47c2-9517-aaa00f24a902	Ricardo	xdricardo63@gmail.com	t	\N	admin	2026-11-08 23:30:25.75323+00	2026-11-08 23:30:25.75323+00
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verification (id, identifier, value, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: postgres
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 5, true);


--
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_id_seq', 2, true);


--
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_id_seq', 5, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: ajustes_sitio ajustes_sitio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ajustes_sitio
    ADD CONSTRAINT ajustes_sitio_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_slug_unique UNIQUE (slug);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: productos productos_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_slug_unique UNIQUE (slug);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_token_unique UNIQUE (token);


--
-- Name: user user_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_unique UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: account account_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: productos productos_categoria_id_categorias_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_categoria_id_categorias_id_fk FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE RESTRICT;


--
-- Name: session session_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict aqGu5j69zbwIvK8HYfqdHs30GU3warS9Uc63XwI2t9orjO4oDdktR6zqKdZdQvS

