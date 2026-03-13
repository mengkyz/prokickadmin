"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PackageModal } from "@/components/packages/PackageModal";
import { fetchPackages } from "@/lib/db/packages";
import type { Package } from "@/lib/types";

type Modal = "none" | "create" | "edit";

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>("none");
  const [editTarget, setEditTarget] = useState<Package | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPackages();
      setPackages(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openEdit(pkg: Package) {
    setEditTarget(pkg);
    setModal("edit");
  }

  function openCreate() {
    setEditTarget(undefined);
    setModal("create");
  }

  const adult = packages.filter((p) => p.category === "Adult");
  const junior = packages.filter((p) => p.category === "Junior");

  const PackageTable = ({ packages: pkgs }: { packages: Package[] }) => (
    <table>
      <thead>
        <tr>
          <th>ชื่อ</th>
          <th>ราคา</th>
          <th>Sessions</th>
          <th>วัน</th>
          <th>Extra</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {pkgs.length === 0 ? (
          <tr>
            <td colSpan={6} style={{ textAlign: "center", color: "var(--t3)", padding: "20px 0", fontSize: 13 }}>
              ยังไม่มีแพ็กเกจ
            </td>
          </tr>
        ) : (
          pkgs.map((pkg) => (
            <tr key={pkg.id}>
              <td><div style={{ fontSize: 12, fontWeight: 600 }}>{pkg.name}</div></td>
              <td className="pk-mono" style={{ color: "var(--orange)" }}>{pkg.price.toLocaleString()} ฿</td>
              <td className="pk-mono">{pkg.sessions}</td>
              <td className="pk-mono">{pkg.durationDays}</td>
              <td className="pk-mono">{pkg.extraEnabled ? `${pkg.extraLimit}×${pkg.extraPrice}฿` : "—"}</td>
              <td>
                <Button variant="ghost" size="sm" onClick={() => openEdit(pkg)}>แก้ไข</Button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, color: "var(--t3)", fontSize: 14 }}>
        กำลังโหลด...
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <Card>
          <CardHeader
            icon="📦"
            title="แพ็กเกจผู้ใหญ่"
            actions={<Button variant="primary" size="sm" onClick={openCreate}>+ สร้างแพ็กเกจ</Button>}
          />
          <PackageTable packages={adult} />
        </Card>

        <Card>
          <CardHeader
            icon="🧒"
            title="แพ็กเกจเด็ก"
            actions={<Button variant="primary" size="sm" onClick={openCreate}>+ สร้างแพ็กเกจ</Button>}
          />
          <PackageTable packages={junior} />
        </Card>
      </div>

      <PackageModal
        open={modal === "create"}
        onClose={() => setModal("none")}
        mode="create"
        onSuccess={load}
      />
      <PackageModal
        key={editTarget?.id}
        open={modal === "edit"}
        onClose={() => setModal("none")}
        mode="edit"
        initial={editTarget}
        onSuccess={load}
      />
    </>
  );
}
