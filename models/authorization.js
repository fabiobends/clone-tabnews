import { InternalServerError } from "infra/errors";

const availableFeatures = [
  "read:user",
  "read:user:self",
  "create:user",
  "update:user",
  "update:user:others",
  "read:session",
  "create:session",
  "read:activation_token",
  "read:migration",
  "create:migration",
  "read:status",
  "read:status:all",
];

function can(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);

  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = false;

    if (resource.id === user.id || can(user, "update:user:others")) {
      authorized = true;
    }
  }

  return authorized;
}

function validateUser(user) {
  if (!user || !user.features) {
    throw new InternalServerError({
      cause: "User is required on authorization model.",
    });
  }
}

function validateFeature(feature) {
  if (!feature || !availableFeatures.includes(feature)) {
    throw new InternalServerError({
      cause: "Known feature is required on authorization model",
    });
  }
}

function validateResource(resource) {
  if (!resource) {
    throw new InternalServerError({
      cause: "Resource is required on authorization model",
    });
  }
}

function filterOutput(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);

  if (feature === "read:user" && resource) {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }

  if (feature === "read:user:self" && resource && resource.id === user.id) {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      email: resource.email,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }

  if (feature === "read:session" && resource && resource.user_id === user.id) {
    return {
      id: resource.id,
      token: resource.token,
      user_id: resource.user_id,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
      expires_at: resource.expires_at,
    };
  }

  if (feature === "read:activation_token" && resource) {
    return {
      id: resource.id,
      user_id: resource.user_id,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
      expires_at: resource.expires_at,
      used_at: resource.used_at,
    };
  }

  if (feature === "read:migration" && resource) {
    return resource.map((migration) => ({
      path: migration.path,
      name: migration.name,
      timestamp: migration.timestamp,
    }));
  }

  if (feature === "read:status") {
    const output = {
      updated_at: resource.updated_at,
      dependencies: {
        database: {
          max_connections: resource.dependencies.database.max_connections,
          opened_connections: resource.dependencies.database.opened_connections,
        },
      },
    };

    if (can(user, "read:status:all")) {
      output.dependencies.database.version =
        resource.dependencies.database.version;
    }

    return output;
  }

  return null;
}

const authorization = {
  can,
  filterOutput,
};

export default authorization;
