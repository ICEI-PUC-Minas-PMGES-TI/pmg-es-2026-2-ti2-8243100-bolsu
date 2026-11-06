import { createFileRoute, Navigate } from '@tanstack/react-router'
export const Route = createFileRoute('/teste')({ component: () => <Navigate to="/inicio" replace /> })
