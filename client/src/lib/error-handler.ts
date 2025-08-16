import React from 'react';
import { toast } from '@/hooks/use-toast';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class ErrorHandler {
  static handleApiError(error: any): ApiError {
    let message = 'Une erreur inattendue s\'est produite';
    let status = 500;
    let code = 'UNKNOWN_ERROR';

    if (error.response) {
      // API response error
      status = error.response.status;
      message = error.response.data?.message || error.message;
      code = error.response.data?.code;

      switch (status) {
        case 400:
          message = 'Données invalides. Veuillez vérifier votre saisie.';
          break;
        case 401:
          message = 'Session expirée. Veuillez vous reconnecter.';
          code = 'UNAUTHORIZED';
          break;
        case 403:
          message = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
          break;
        case 404:
          message = 'Ressource non trouvée.';
          break;
        case 409:
          message = 'Conflit de données. Cette ressource existe déjà.';
          break;
        case 429:
          message = 'Trop de requêtes. Veuillez patienter avant de réessayer.';
          break;
        case 500:
          message = 'Erreur serveur. Notre équipe technique a été notifiée.';
          break;
        case 503:
          message = 'Service temporairement indisponible. Veuillez réessayer plus tard.';
          break;
        default:
          message = `Erreur ${status}: ${error.response.data?.message || error.message}`;
      }
    } else if (error.request) {
      // Network error
      message = 'Erreur de connexion. Vérifiez votre connexion internet.';
      code = 'NETWORK_ERROR';
    } else {
      // Other error
      message = error.message || message;
    }

    return { message, status, code };
  }

  static showError(error: any, customMessage?: string) {
    const apiError = this.handleApiError(error);
    
    toast({
      title: "Erreur",
      description: customMessage || apiError.message,
      variant: "destructive",
    });

    // Log error for debugging
    console.error('API Error:', error, apiError);
  }

  static showSuccess(message: string, title: string = "Succès") {
    toast({
      title,
      description: message,
      variant: "default",
    });
  }

  static showWarning(message: string, title: string = "Attention") {
    toast({
      title,
      description: message,
      variant: "default",
    });
  }

  static showInfo(message: string, title: string = "Information") {
    toast({
      title,
      description: message,
      variant: "default",
    });
  }
}