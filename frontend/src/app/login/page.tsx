"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SpaceBetween,
  Button,
  FormField,
  Input,
  Alert,
  Checkbox,
  Link,
} from "@cloudscape-design/components";
import "@cloudscape-design/global-styles/index.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Login failed");
      }

      const data = await res.json();
      localStorage.setItem("aws-mock-token", data.token);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return <div style={{ minHeight: "100vh", backgroundColor: "#f2f3f3" }} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f2f3f3" }}>
      {/* Left Side - Login Form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        {/* AWS Logo Placeholder */}
        <div style={{ marginBottom: "10px" }}>
          <img src="/aws-logo-black.png" alt="AWS Logo" style={{ height: "100px" }} />
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: "380px",
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #eaeded",
            boxShadow: "0 1px 1px rgba(0,0,0,0.05)",
          }}
        >
          <form onSubmit={handleLogin}>
            <SpaceBetween size="l">
              <div style={{ fontSize: "20px", fontWeight: 700 }}>IAM user sign in</div>
              {error ? (
                <Alert type="error" header="Authentication failed">
                  {error}
                </Alert>
              ) : null}

              <FormField label="IAM username">
                <Input
                  value={username}
                  onChange={({ detail }) => setUsername(detail.value)}
                  placeholder="admin"
                  autoComplete="username"
                />
              </FormField>

              <FormField label="Password">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={({ detail }) => setPassword(detail.value)}
                  placeholder="password"
                  autoComplete="current-password"
                />
              </FormField>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Checkbox
                  onChange={({ detail }) => setShowPassword(detail.checked)}
                  checked={showPassword}
                >
                  Show Password
                </Checkbox>
                <Link variant="info" href="#">
                  Having trouble?
                </Link>
              </div>

              <Button
                variant="primary"
                formAction="submit"
                fullWidth
                loading={isLoading}
                disabled={!username || !password}
              >
                Sign in
              </Button>
            </SpaceBetween>
          </form>
        </div>
      </div>

      {/* Right Side - Marketing Image Placeholder */}
      <div
        style={{
            flex: 1,
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderLeft: "1px solid #d5dbdb",
            padding: "10px",
        }}
       >
        <img
            src="/side-pic.png"
            alt="Open data architectures with Apache Iceberg"
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
       />
    </div>
    </div>
  );
}