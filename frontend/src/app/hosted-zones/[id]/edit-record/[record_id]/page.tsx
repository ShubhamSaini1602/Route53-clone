"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Form,
  SpaceBetween,
  Button,
  Container,
  Header,
  FormField,
  Input,
  Textarea,
  Grid,
  Box
} from "@cloudscape-design/components";
import ConsoleLayout from "@/components/ConsoleLayout";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function EditDNSRecordContent() {
  const params = useParams();
  const router = useRouter();
  
  // Extract both dynamic route parameters safely
  const zoneId = params?.id as string;
  const recordId = params?.record_id as string;

  const [zoneDomain, setZoneDomain] = useState("");
  const [recordName, setRecordName] = useState("");
  const [recordType, setRecordType] = useState("");
  const [recordValue, setRecordValue] = useState("");
  const [ttl, setTtl] = useState("300");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!zoneId || !recordId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch zone to get the domain name for breadcrumbs
        const zoneRes = await fetch(`${API_BASE_URL}/api/hosted-zones/${zoneId}`);
        if (zoneRes.ok) {
          const zoneData = await zoneRes.json();
          setZoneDomain(zoneData.name);
        }

        // 2. Fetch all records to find the specific one being edited
        const recordsRes = await fetch(`${API_BASE_URL}/api/hosted-zones/${zoneId}/records`);
        if (recordsRes.ok) {
          const recordsData = await recordsRes.json();
          const currentRecord = recordsData.find((r: any) => r.id === recordId);
          
          if (currentRecord) {
            // Pre-fill the form state with the existing record data
            setRecordName(currentRecord.name);
            setRecordType(currentRecord.type);
            setRecordValue(currentRecord.value);
            setTtl(currentRecord.ttl.toString());
          } else {
            setErrorMessage("Record not found in this hosted zone.");
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setErrorMessage("Failed to load record details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [zoneId, recordId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!recordValue.trim()) {
      setErrorMessage("Record value is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/hosted-zones/${zoneId}/records/${recordId}`, {
        method: "PUT", // Matches your backend FastAPI route for updates
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: recordValue.trim(),
          ttl: parseInt(ttl) || 300,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update DNS record.");
      }

      // Success, route back to the records list
      router.push(`/hosted-zones/${zoneId}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConsoleLayout
      activeHref="/hosted-zones"
      pageTitle="Edit record"
      breadcrumbs={[
        { text: "Route 53", href: "/" },
        { text: "Hosted zones", href: "/hosted-zones" },
        { text: zoneDomain || zoneId, href: `/hosted-zones/${zoneId}` },
        { text: "Edit record", href: `/hosted-zones/${zoneId}/edit-record/${recordId}` },
      ]}
    >
      <form onSubmit={handleSubmit}>
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button formAction="none" variant="link" onClick={() => router.push(`/hosted-zones/${zoneId}`)}>
                Cancel
              </Button>
              <Button variant="primary" disabled={isLoading || isSubmitting} loading={isSubmitting}>
                Save changes
              </Button>
            </SpaceBetween>
          }
          errorText={errorMessage}
        >
          <SpaceBetween size="l">
            <Container header={<Header variant="h2">Record details</Header>}>
              {isLoading ? (
                <Box padding="l" textAlign="center">Loading record details...</Box>
              ) : (
                <SpaceBetween size="l">
                  <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
                    
                    {/* Name is read-only in Route 53 edit mode */}
                    <FormField 
                      label="Record name" 
                      description="The name of the record cannot be changed after creation."
                    >
                      <Input value={recordName} disabled={true} />
                    </FormField>

                    {/* Type is read-only in Route 53 edit mode */}
                    <FormField 
                      label="Record type" 
                      description="The type of the record cannot be changed after creation."
                    >
                      <Input value={recordType} disabled={true} />
                    </FormField>

                  </Grid>

                  <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
                    
                    <FormField
                      label="Value"
                      description="Enter multiple values on separate lines."
                      stretch={true}
                    >
                      <Textarea
                        value={recordValue}
                        onChange={({ detail }) => setRecordValue(detail.value)}
                        placeholder={`Enter ${recordType} values...`}
                        rows={5}
                      />
                    </FormField>

                    <FormField
                      label="TTL (seconds)"
                      description="Time to live in seconds."
                    >
                      <Input
                        type="number"
                        value={ttl}
                        onChange={({ detail }) => setTtl(detail.value)}
                      />
                    </FormField>

                  </Grid>
                </SpaceBetween>
              )}
            </Container>
          </SpaceBetween>
        </Form>
      </form>
    </ConsoleLayout>
  );
}

// Wrap in Suspense to prevent Next.js server prerendering blocks
export default function EditDNSRecord() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#0f1b2a" }} />}>
      <EditDNSRecordContent />
    </Suspense>
  );
}