export const reportMissingEnvVars = () => {
  for (const key in process.env) {
    const value = process.env[key];

    if (value === '[redacted]') {
      console.warn(`Seems you forgot to set a value for env var: ${key}`);
    }
  }
};