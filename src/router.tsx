import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { installChunkRecovery } from "@/lib/reload";
import { routeTree } from "./routeTree.gen";

installChunkRecovery();

export function getRouter() {
  return createRouter({ routeTree, defaultErrorComponent: AppErrorComponent });
}
