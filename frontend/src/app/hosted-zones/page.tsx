"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  Header,
  SpaceBetween,
  Button,
  TextFilter,
  Pagination,
  Box,
  Link,
  Modal,
  FormField,
  Textarea
} from "@cloudscape-design/components";
import ConsoleLayout from "@/components/ConsoleLayout";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Define the TypeScript interface based on your FastAPI schema
interface HostedZone {
  id: string;
  name: string;
  comment: string | null;
  zone_type: string;
  record_count: number;
}

export default function HostedZonesList() {
  const router = useRouter();
  
  // Table State
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<HostedZone[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const pageSize = 10;

  // Fetch Zones
  const fetchZones = async (search = "", page = 1) => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const baseUrl = `${API_BASE_URL}/api/hosted-zones?skip=${skip}&limit=${pageSize}`;
      const url = search ? `${baseUrl}&search=${search}` : baseUrl;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      }
    } catch (error) {
      console.error("Failed to fetch hosted zones", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Load & Search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchZones(searchQuery, currentPageIndex);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentPageIndex]);

  // Handlers
  const handleDelete = async () => {
    if (selectedItems.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/hosted-zones/${selectedItems[0].id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setSelectedItems([]);
        fetchZones(searchQuery);
      }
    } catch (error) {
      console.error("Failed to delete", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async () => {
    if (selectedItems.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/hosted-zones/${selectedItems[0].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: editDescription }),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setSelectedItems([]);
        fetchZones(searchQuery);
      }
    } catch (error) {
      console.error("Failed to edit", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = () => {
    setEditDescription(selectedItems[0]?.comment || "");
    setIsEditModalOpen(true);
  };

  return (
    <ConsoleLayout
      activeHref="/hosted-zones"
      pageTitle="Hosted zones"
      breadcrumbs={[
        { text: "Route 53", href: "/" },
        { text: "Hosted zones", href: "/hosted-zones" },
      ]}
    >
      <Table
        columnDefinitions={[
          {
            id: "name",
            header: "Domain name",
            cell: item => <Link onFollow={() => router.push(`/hosted-zones/${item.id}`)}>{item.name}</Link>,
            isRowHeader: true
          },
          {
            id: "type",
            header: "Type",
            cell: item => item.zone_type === "public" ? "Public" : "Private"
          },
          {
            id: "recordCount",
            header: "Record count",
            cell: item => item.record_count
          },
          {
            id: "comment",
            header: "Description",
            cell: item => item.comment || "-"
          }
        ]}
        items={zones}
        loading={isLoading}
        loadingText="Loading hosted zones..."
        selectionType="single"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems as HostedZone[])}
        empty={
          <Box textAlign="center" color="inherit">
            <b>No hosted zones</b>
            <Box padding={{ bottom: "s" }} variant="p" color="inherit">
              No hosted zones found.
            </Box>
            <Button onClick={() => router.push("/hosted-zones/create")}>Create hosted zone</Button>
          </Box>
        }
        filter={
          <TextFilter
            filteringPlaceholder="Find hosted zones"
            filteringText={searchQuery}
            onChange={({ detail }) => setSearchQuery(detail.filteringText)}
          />
        }
        header={
          <Header
            variant="h2"
            counter={selectedItems.length ? `(1/${zones.length})` : `(${zones.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button 
                  disabled={selectedItems.length !== 1} 
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Delete
                </Button>
                <Button 
                  disabled={selectedItems.length !== 1} 
                  onClick={openEditModal}
                >
                  Edit details
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => router.push("/hosted-zones/create")}
                >
                  Create hosted zone
                </Button>
              </SpaceBetween>
            }
          >
            Hosted zones
          </Header>
        }
        pagination={
          <Pagination 
            currentPageIndex={currentPageIndex} 
            onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
            pagesCount={zones.length === pageSize ? currentPageIndex + 1 : currentPageIndex} 
          />
        }
      />

      {/* Delete Modal */}
      <Modal
        onDismiss={() => setIsDeleteModalOpen(false)}
        visible={isDeleteModalOpen}
        closeAriaLabel="Close modal"
        header="Delete hosted zone"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleDelete} loading={isProcessing}>Delete</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box variant="span">
            Are you sure you want to delete the hosted zone <b>{selectedItems[0]?.name}</b>?
          </Box>
          <Box variant="span" color="text-status-error">
            This action cannot be undone. All DNS records within this zone will be permanently deleted.
          </Box>
        </SpaceBetween>
      </Modal>

      {/* Edit Modal */}
      <Modal
        onDismiss={() => setIsEditModalOpen(false)}
        visible={isEditModalOpen}
        closeAriaLabel="Close modal"
        header={`Edit details for ${selectedItems[0]?.name}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleEdit} loading={isProcessing}>Save changes</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <FormField label="Description - optional" description="Update the description for this hosted zone.">
          <Textarea
            value={editDescription}
            onChange={({ detail }) => setEditDescription(detail.value)}
            placeholder="Description"
            rows={3}
          />
        </FormField>
      </Modal>

    </ConsoleLayout>
  );
}