"use client";

import React from "react";
import { Modal, FormGrid, FormItem, DefaultFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/context/ToastContext";

interface EditClassModalProps {
  open: boolean;
  onClose: () => void;
}

export function EditClassModal({ open, onClose }: EditClassModalProps) {
  const { showToast } = useToast();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="✏️ แก้ไขคลาส"
      width={440}
      footer={
        <>
          <Button variant="danger" size="sm" onClick={() => { onClose(); showToast("ยกเลิกคลาส", "error"); }}>
            ยกเลิกคลาส
          </Button>
          <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
          <Button variant="primary" onClick={() => { onClose(); showToast("บันทึกแล้ว"); }}>บันทึก</Button>
        </>
      }
    >
      <FormGrid>
        <FormItem label="วันที่" full>
          <input type="date" defaultValue="2026-03-03" />
        </FormItem>
        <FormItem label="เวลาเริ่ม">
          <input type="time" defaultValue="19:00" />
        </FormItem>
        <FormItem label="เวลาสิ้นสุด">
          <input type="time" defaultValue="20:30" />
        </FormItem>
        <FormItem label="สนาม">
          <select>
            <option>Grand Field (max 20)</option>
            <option>Arena A</option>
            <option>Small Arena</option>
          </select>
        </FormItem>
        <FormItem label="โค้ช">
          <select>
            <option>Pro Coach</option>
            <option>Coach Arm</option>
          </select>
        </FormItem>
        <FormItem label="จำนวนรับ">
          <input type="number" defaultValue={20} />
        </FormItem>
        <FormItem label="หมายเหตุ" full>
          <textarea />
        </FormItem>
      </FormGrid>
    </Modal>
  );
}
