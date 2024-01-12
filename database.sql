--
-- PostgreSQL database dump
--

-- Dumped from database version 14.10 (Ubuntu 14.10-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.10 (Ubuntu 14.10-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO postgres;

--
-- Name: core; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA core;


ALTER SCHEMA core OWNER TO postgres;

--
-- Name: column_type; Type: TYPE; Schema: core; Owner: postgres
--

CREATE TYPE core.column_type AS ENUM (
    'todo',
    'in_progress',
    'done'
);


ALTER TYPE core.column_type OWNER TO postgres;

--
-- Name: TYPE column_type; Type: COMMENT; Schema: core; Owner: postgres
--

COMMENT ON TYPE core.column_type IS 'Type of column considered in milestone progression';


--
-- Name: field_role; Type: TYPE; Schema: core; Owner: postgres
--

CREATE TYPE core.field_role AS ENUM (
    'tags',
    'deadline'
);


ALTER TYPE core.field_role OWNER TO postgres;

--
-- Name: TYPE field_role; Type: COMMENT; Schema: core; Owner: postgres
--

COMMENT ON TYPE core.field_role IS 'Role of field used to differentiate required fields like tags and deadline';


--
-- Name: field_type; Type: TYPE; Schema: core; Owner: postgres
--

CREATE TYPE core.field_type AS ENUM (
    'text',
    'number',
    'date',
    'checkbox',
    'dropdown_single',
    'dropdown_multiple'
);


ALTER TYPE core.field_type OWNER TO postgres;

--
-- Name: TYPE field_type; Type: COMMENT; Schema: core; Owner: postgres
--

COMMENT ON TYPE core.field_type IS 'Type of field and the data it contains';


--
-- Name: get_card_fields_values(uuid); Type: FUNCTION; Schema: core; Owner: postgres
--

CREATE FUNCTION core.get_card_fields_values(i_card_uuid uuid) RETURNS TABLE(field_uuid uuid, field_name character varying, field_type core.field_type, date_value date, checkbox_value boolean, number_value double precision, select_value character varying, select_color character, text_value character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN

    RETURN QUERY
        SELECT core.fields.field_uuid AS field_uuid,
               core.fields.name       AS field_name,
               core.fields.type       as field_type,
               d.date_value,
               c.checkbox_value,
               n.number_value,
               s.select_value,
               s.select_color,
               t.text_value
        FROM core.fields
                 LEFT JOIN (SELECT core.date_values.value as date_value,
                                   core.date_values.field_uuid
                            FROM core.date_values
                            WHERE card_uuid = i_card_uuid) d USING (field_uuid)
                 LEFT JOIN (SELECT core.checkbox_values.value as checkbox_value,
                                   core.checkbox_values.field_uuid,
                                   card_uuid
                            FROM core.checkbox_values
                            WHERE card_uuid = i_card_uuid) c USING (field_uuid)
                 LEFT JOIN (SELECT core.number_values.value as number_value,
                                   core.number_values.field_uuid
                            FROM core.number_values
                            WHERE card_uuid = i_card_uuid) n USING (field_uuid)
                 LEFT JOIN (SELECT core.select_options.value as select_value,
                                   core.select_options.color as select_color,
                                   core.select_options.field_uuid
                            FROM core.select_values
                                     INNER JOIN core.select_options USING (select_option_uuid, field_uuid)
                            WHERE card_uuid = i_card_uuid) s USING (field_uuid)
                 LEFT JOIN (SELECT core.text_values.value as text_value,
                                   core.text_values.field_uuid
                            FROM core.text_values
                            WHERE card_uuid = i_card_uuid) t USING (field_uuid)
        WHERE role IS NULL;
END;
$$;


ALTER FUNCTION core.get_card_fields_values(i_card_uuid uuid) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.accounts (
    id integer NOT NULL,
    "userId" uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(255) NOT NULL,
    provider character varying(255) NOT NULL,
    "providerAccountId" character varying(255) NOT NULL,
    refresh_token text,
    access_token text,
    expires_at bigint,
    id_token text,
    scope text,
    session_state text,
    token_type text
);


ALTER TABLE auth.accounts OWNER TO postgres;

--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: auth; Owner: postgres
--

CREATE SEQUENCE auth.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth.accounts_id_seq OWNER TO postgres;

--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: postgres
--

ALTER SEQUENCE auth.accounts_id_seq OWNED BY auth.accounts.id;


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.sessions (
    id integer NOT NULL,
    "userId" uuid DEFAULT gen_random_uuid() NOT NULL,
    expires timestamp with time zone NOT NULL,
    "sessionToken" character varying(255) NOT NULL
);


ALTER TABLE auth.sessions OWNER TO postgres;

--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: auth; Owner: postgres
--

CREATE SEQUENCE auth.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth.sessions_id_seq OWNER TO postgres;

--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: postgres
--

ALTER SEQUENCE auth.sessions_id_seq OWNED BY auth.sessions.id;


--
-- Name: users; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255),
    email character varying(255),
    "emailVerified" timestamp with time zone,
    image text
);


ALTER TABLE auth.users OWNER TO postgres;

--
-- Name: verification_token; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.verification_token (
    identifier text NOT NULL,
    expires timestamp with time zone NOT NULL,
    token text NOT NULL
);


ALTER TABLE auth.verification_token OWNER TO postgres;

--
-- Name: card_users; Type: TABLE; Schema: core; Owner: postgres
--

CREATE TABLE core.card_users (
    user_uuid uuid NOT NULL,
    card_uuid uuid NOT NULL
);


ALTER TABLE core.card_users OWNER TO postgres;

--
-- Name: cards; Type: TABLE; Schema: core; Owner: postgres
--

CREATE TABLE core.cards (
    name character varying,
    description character varying,
    story_points integer,
    creation_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "order" integer NOT NULL,
    card_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    milestone_uuid uuid,
    column_uuid uuid NOT NULL
);


ALTER TABLE core.cards OWNER TO postgres;

--
-- Name: cards_order_seq; Type: SEQUENCE; Schema: core; Owner: postgres
--

ALTER TABLE core.cards ALTER COLUMN "order" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME core.cards_order_seq
    START WITH 0
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1
);


--
-- Name: checkbox_values; Type: TABLE; Schema: core; Owner: postgres
--

CREATE TABLE core.checkbox_values (
    value boolean NOT NULL,
    card_uuid uuid NOT NULL,
    field_uuid uuid NOT NULL
);


ALTER TABLE core.checkbox_values OWNER TO postgres;

--
-- Name: columns; Type: TABLE; Schema: core; Owner: postgres
--

CREATE TABLE core.columns (
    name character varying,
    "order" integer NOT NULL,
    type core.column_type,
    description character varying,
    column_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    project_uuid uuid NOT NULL
);


ALTER TABLE core.columns OWNER TO postgres;

--
-- Name: columns_order_seq; Type: SEQUENCE; Schema: core; Owner: postgres
--

ALTER TABLE core.columns ALTER COLUMN "order" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME core.columns_order_seq
    START WITH 0
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1
);


--
-- Name: date_values; Type: TABLE; Schema: core; Owner: postgres
--

CREATE TABLE core.date_values (
    value date NOT NULL,
    card_uuid uuid NOT NULL,
    field_uuid uuid NOT NULL
);


ALTER TABLE core.date_values OWNER TO postgres;

--
-- Name: fields; Type: TABLE; Schema: core; Owner: postgres
--

CREATE TABLE core.fields (
    name character varying NOT NULL,
    type core.field_type NOT NULL,
    "order" integer NOT NULL,
    field_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    project_uuid uuid NOT NULL,
    role core.field_role
);


ALTER TABLE core.fields OWNER TO postgres;

--
-- Name: fields_order_seq; Type: SEQUENCE; Schema: core; Owner: postgres
--

ALTER TABLE core.fields ALTER COLUMN "order" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME core.fields_order_seq
    START WITH 0
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1
);


--
-- Name: milestones; Type: TABLE; Schema: core; Owner: postgres
--

CREATE TABLE core.milestones (
    name character varying,
    creation_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deadline timestamp with time zone,
    milestone_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    project_uuid uuid NOT NULL
);


ALTER TABLE core.milestones OWNER TO postgres;

--
-- Name: number_values; Type: TABLE; Schema: core; Owner: postgres
--

CREATE TABLE core.number_values (
    value double precision NOT NULL,
    card_uuid uuid NOT NULL,
    field_uuid uuid NOT NULL
);


ALTER TABLE core.number_values OWNER TO postgres;

--
-- Name: project_users; Type: TABLE; Schema: core; Owner: postgres
--

CREATE TABLE core.project_users (
    permissions integer DEFAULT 0 NOT NULL,
    project_uuid uuid NOT NULL,
    user_uuid uuid NOT NULL
);


ALTER TABLE core.project_users OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: core; Owner: postgres
--

CREATE TABLE core.projects (
    name character varying NOT NULL,
    creation_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    project_uuid uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE core.projects OWNER TO postgres;

--
-- Name: select_options; Type: TABLE; Schema: core; Owner: postgres
--

CREATE TABLE core.select_options (
    value character varying,
    color character(7),
    select_option_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    field_uuid uuid NOT NULL
);


ALTER TABLE core.select_options OWNER TO postgres;

--
-- Name: select_values; Type: TABLE; Schema: core; Owner: postgres
--

CREATE TABLE core.select_values (
    card_uuid uuid NOT NULL,
    field_uuid uuid NOT NULL,
    select_option_uuid uuid NOT NULL
);


ALTER TABLE core.select_values OWNER TO postgres;

--
-- Name: text_values; Type: TABLE; Schema: core; Owner: postgres
--

CREATE TABLE core.text_values (
    value character varying NOT NULL,
    card_uuid uuid NOT NULL,
    field_uuid uuid NOT NULL
);


ALTER TABLE core.text_values OWNER TO postgres;

--
-- Name: accounts id; Type: DEFAULT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.accounts ALTER COLUMN id SET DEFAULT nextval('auth.accounts_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.sessions ALTER COLUMN id SET DEFAULT nextval('auth.sessions_id_seq'::regclass);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_token verification_token_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.verification_token
    ADD CONSTRAINT verification_token_pkey PRIMARY KEY (identifier, token);


--
-- Name: card_users card_users_pk; Type: CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.card_users
    ADD CONSTRAINT card_users_pk PRIMARY KEY (card_uuid, user_uuid);


--
-- Name: cards cards_pk; Type: CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.cards
    ADD CONSTRAINT cards_pk PRIMARY KEY (card_uuid);


--
-- Name: checkbox_values checkbox_values_pk; Type: CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.checkbox_values
    ADD CONSTRAINT checkbox_values_pk PRIMARY KEY (field_uuid, card_uuid);


--
-- Name: columns columns_pk; Type: CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.columns
    ADD CONSTRAINT columns_pk PRIMARY KEY (column_uuid);


--
-- Name: date_values date_values_pk; Type: CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.date_values
    ADD CONSTRAINT date_values_pk PRIMARY KEY (field_uuid, card_uuid);


--
-- Name: fields fields_pk; Type: CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.fields
    ADD CONSTRAINT fields_pk PRIMARY KEY (field_uuid);


--
-- Name: milestones milestones_pk; Type: CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.milestones
    ADD CONSTRAINT milestones_pk PRIMARY KEY (milestone_uuid);


--
-- Name: number_values number_values_pk; Type: CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.number_values
    ADD CONSTRAINT number_values_pk PRIMARY KEY (card_uuid, field_uuid);


--
-- Name: project_users project_users_pk; Type: CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.project_users
    ADD CONSTRAINT project_users_pk PRIMARY KEY (project_uuid, user_uuid);


--
-- Name: projects projects_pk; Type: CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.projects
    ADD CONSTRAINT projects_pk PRIMARY KEY (project_uuid);


--
-- Name: select_options select_options_pk; Type: CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.select_options
    ADD CONSTRAINT select_options_pk PRIMARY KEY (select_option_uuid);


--
-- Name: select_values select_values_pk; Type: CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.select_values
    ADD CONSTRAINT select_values_pk PRIMARY KEY (field_uuid, card_uuid, select_option_uuid);


--
-- Name: text_values text_values_pk; Type: CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.text_values
    ADD CONSTRAINT text_values_pk PRIMARY KEY (card_uuid, field_uuid);


--
-- Name: accounts accounts_users_id_fk; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.accounts
    ADD CONSTRAINT accounts_users_id_fk FOREIGN KEY ("userId") REFERENCES auth.users(id);


--
-- Name: sessions sessions_users_id_fk; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_users_id_fk FOREIGN KEY ("userId") REFERENCES auth.users(id);


--
-- Name: card_users card_users_cards_card_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.card_users
    ADD CONSTRAINT card_users_cards_card_uuid_fk FOREIGN KEY (card_uuid) REFERENCES core.cards(card_uuid);


--
-- Name: card_users card_users_users_id_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.card_users
    ADD CONSTRAINT card_users_users_id_fk FOREIGN KEY (user_uuid) REFERENCES auth.users(id);


--
-- Name: cards cards_columns_column_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.cards
    ADD CONSTRAINT cards_columns_column_uuid_fk FOREIGN KEY (column_uuid) REFERENCES core.columns(column_uuid);


--
-- Name: cards cards_milestones_milestone_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.cards
    ADD CONSTRAINT cards_milestones_milestone_uuid_fk FOREIGN KEY (milestone_uuid) REFERENCES core.milestones(milestone_uuid);


--
-- Name: checkbox_values checkbox_values_cards_card_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.checkbox_values
    ADD CONSTRAINT checkbox_values_cards_card_uuid_fk FOREIGN KEY (card_uuid) REFERENCES core.cards(card_uuid);


--
-- Name: checkbox_values checkbox_values_fields_field_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.checkbox_values
    ADD CONSTRAINT checkbox_values_fields_field_uuid_fk FOREIGN KEY (field_uuid) REFERENCES core.fields(field_uuid);


--
-- Name: columns columns_projects_project_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.columns
    ADD CONSTRAINT columns_projects_project_uuid_fk FOREIGN KEY (project_uuid) REFERENCES core.projects(project_uuid);


--
-- Name: date_values date_values_cards_card_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.date_values
    ADD CONSTRAINT date_values_cards_card_uuid_fk FOREIGN KEY (card_uuid) REFERENCES core.cards(card_uuid);


--
-- Name: date_values date_values_fields_field_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.date_values
    ADD CONSTRAINT date_values_fields_field_uuid_fk FOREIGN KEY (field_uuid) REFERENCES core.fields(field_uuid);


--
-- Name: fields fields_projects_project_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.fields
    ADD CONSTRAINT fields_projects_project_uuid_fk FOREIGN KEY (project_uuid) REFERENCES core.projects(project_uuid);


--
-- Name: milestones milestones_projects_project_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.milestones
    ADD CONSTRAINT milestones_projects_project_uuid_fk FOREIGN KEY (project_uuid) REFERENCES core.projects(project_uuid);


--
-- Name: number_values number_values_cards_card_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.number_values
    ADD CONSTRAINT number_values_cards_card_uuid_fk FOREIGN KEY (card_uuid) REFERENCES core.cards(card_uuid);


--
-- Name: number_values number_values_fields_field_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.number_values
    ADD CONSTRAINT number_values_fields_field_uuid_fk FOREIGN KEY (field_uuid) REFERENCES core.fields(field_uuid);


--
-- Name: project_users project_users_projects_project_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.project_users
    ADD CONSTRAINT project_users_projects_project_uuid_fk FOREIGN KEY (project_uuid) REFERENCES core.projects(project_uuid);


--
-- Name: project_users project_users_users_id_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.project_users
    ADD CONSTRAINT project_users_users_id_fk FOREIGN KEY (user_uuid) REFERENCES auth.users(id);


--
-- Name: select_options select_options_fields_field_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.select_options
    ADD CONSTRAINT select_options_fields_field_uuid_fk FOREIGN KEY (field_uuid) REFERENCES core.fields(field_uuid);


--
-- Name: select_values select_values_cards_card_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.select_values
    ADD CONSTRAINT select_values_cards_card_uuid_fk FOREIGN KEY (card_uuid) REFERENCES core.cards(card_uuid);


--
-- Name: select_values select_values_fields_field_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.select_values
    ADD CONSTRAINT select_values_fields_field_uuid_fk FOREIGN KEY (field_uuid) REFERENCES core.fields(field_uuid);


--
-- Name: select_values select_values_select_options_select_option_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.select_values
    ADD CONSTRAINT select_values_select_options_select_option_uuid_fk FOREIGN KEY (select_option_uuid) REFERENCES core.select_options(select_option_uuid);


--
-- Name: text_values text_values_cards_card_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.text_values
    ADD CONSTRAINT text_values_cards_card_uuid_fk FOREIGN KEY (card_uuid) REFERENCES core.cards(card_uuid);


--
-- Name: text_values text_values_fields_field_uuid_fk; Type: FK CONSTRAINT; Schema: core; Owner: postgres
--

ALTER TABLE ONLY core.text_values
    ADD CONSTRAINT text_values_fields_field_uuid_fk FOREIGN KEY (field_uuid) REFERENCES core.fields(field_uuid);


--
-- PostgreSQL database dump complete
--

