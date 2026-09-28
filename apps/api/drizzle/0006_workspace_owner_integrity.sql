CREATE OR REPLACE FUNCTION enforce_workspace_owner_integrity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  owner_count bigint;
BEGIN
  IF NOT ('owner' = ANY(string_to_array(OLD.role, ','))) THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP = 'UPDATE'
    AND NEW.workspace_id = OLD.workspace_id
    AND 'owner' = ANY(string_to_array(NEW.role, ',')) THEN
    RETURN NEW;
  END IF;

  -- The workspace row is the serialization point shared by every membership
  -- writer, including Better Auth's direct organization endpoints. During a
  -- workspace DELETE, the parent is already being removed and its cascading
  -- membership deletes must be allowed to finish.
  PERFORM 1 FROM workspace WHERE id = OLD.workspace_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  SELECT count(*)
    INTO owner_count
    FROM workspace_member
   WHERE workspace_id = OLD.workspace_id
     AND 'owner' = ANY(string_to_array(role, ','));

  IF owner_count <= 1 THEN
    RAISE EXCEPTION 'A workspace must keep at least one owner'
      USING ERRCODE = '23514', CONSTRAINT = 'workspace_member_at_least_one_owner';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER workspace_member_owner_integrity
BEFORE UPDATE OF role, workspace_id OR DELETE ON workspace_member
FOR EACH ROW
EXECUTE FUNCTION enforce_workspace_owner_integrity();

CREATE OR REPLACE FUNCTION create_invitation_acceptance_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO notification (id, recipient_id, type, invitation_id)
  SELECT invitation.id, invitation.inviter_id, 'invitation.accepted', invitation.id
    FROM invitation
    JOIN "user" ON lower("user".email) = lower(invitation.email)
   WHERE invitation.workspace_id = NEW.workspace_id
     AND "user".id = NEW.user_id
     AND invitation.status = 'accepted'
     AND invitation.inviter_id <> NEW.user_id
  ON CONFLICT (recipient_id, invitation_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER workspace_member_invitation_notification
AFTER INSERT ON workspace_member
FOR EACH ROW
EXECUTE FUNCTION create_invitation_acceptance_notification();
