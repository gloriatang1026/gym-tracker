import { MachineSetup } from "./storage";

export interface MachineSetupForm {
  startingWeight: string;
  seatHeight: string;
  backrest: string;
  handles: string;
  pivotPoint: string;
}

export const EMPTY_MACHINE_SETUP: MachineSetupForm = {
  startingWeight: "",
  seatHeight: "",
  backrest: "",
  handles: "",
  pivotPoint: "",
};

export function machineSetupFromStorage(setup: MachineSetup): MachineSetupForm {
  return {
    startingWeight:
      setup.startingWeight != null ? String(setup.startingWeight) : "",
    seatHeight: setup.seatHeight != null ? String(setup.seatHeight) : "",
    backrest: setup.backrest != null ? String(setup.backrest) : "",
    handles: setup.handles != null ? String(setup.handles) : "",
    pivotPoint: setup.pivotPoint != null ? String(setup.pivotPoint) : "",
  };
}

export function machineSetupToStorage(
  form?: MachineSetupForm
): MachineSetup | undefined {
  if (!form) return undefined;
  const result: MachineSetup = {};
  const startingWeight = parseFloat(form.startingWeight);
  const seatHeight = parseFloat(form.seatHeight);
  const backrest = parseFloat(form.backrest);
  const handles = parseFloat(form.handles);
  const pivotPoint = parseFloat(form.pivotPoint);
  if (form.startingWeight.trim() !== "" && !Number.isNaN(startingWeight)) {
    result.startingWeight = startingWeight;
  }
  if (form.seatHeight.trim() !== "" && !Number.isNaN(seatHeight)) {
    result.seatHeight = seatHeight;
  }
  if (form.backrest.trim() !== "" && !Number.isNaN(backrest)) {
    result.backrest = backrest;
  }
  if (form.handles.trim() !== "" && !Number.isNaN(handles)) {
    result.handles = handles;
  }
  if (form.pivotPoint.trim() !== "" && !Number.isNaN(pivotPoint)) {
    result.pivotPoint = pivotPoint;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
