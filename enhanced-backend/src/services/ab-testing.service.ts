import { Firestore } from '@google-cloud/firestore';
import { ConfigService } from './config.service';
import { ABTestAssignment } from '../types';

export class ABTestingService {
  private firestore: Firestore;
  private config: ConfigService;

  constructor() {
    this.config = ConfigService.getInstance();
    this.firestore = new Firestore({
      projectId: this.config.getConfig().googleCloudProject,
      databaseId: this.config.getConfig().firestoreDatabase
    });
  }

  public async assignUserToVariant(
    userId: string,
    experimentName: string,
    variants: Record<string, number>
  ): Promise<string> {
    try {
      // Check if user already has an assignment
      const existingAssignment = await this.getUserAssignment(userId, experimentName);
      if (existingAssignment) {
        return existingAssignment;
      }

      // Use consistent hashing for deterministic assignment
      const variant = this.getConsistentVariant(userId, experimentName, variants);

      // Store assignment
      const assignment: ABTestAssignment = {
        user_id: userId,
        experiment_name: experimentName,
        variant,
        assigned_at: new Date().toISOString()
      };

      await this.firestore
        .collection('ab_assignments')
        .doc(`${userId}_${experimentName}`)
        .set(assignment);

      return variant;
    } catch (error) {
      console.error('Error assigning user to variant:', error);
      return Object.keys(variants)[0]; // Fallback to first variant
    }
  }

  public async getUserAssignment(userId: string, experimentName: string): Promise<string | null> {
    try {
      const doc = await this.firestore
        .collection('ab_assignments')
        .doc(`${userId}_${experimentName}`)
        .get();

      if (doc.exists) {
        const data = doc.data() as ABTestAssignment;
        return data.variant;
      }
      return null;
    } catch (error) {
      console.error('Error getting user assignment:', error);
      return null;
    }
  }

  public async trackEvent(
    userId: string,
    experimentName: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<boolean> {
    try {
      const event = {
        user_id: userId,
        experiment_name: experimentName,
        event_type: eventType,
        event_data: eventData,
        timestamp: new Date().toISOString()
      };

      await this.firestore.collection('ab_events').add(event);
      return true;
    } catch (error) {
      console.error('Error tracking event:', error);
      return false;
    }
  }

  public async getExperimentResults(experimentName: string): Promise<any> {
    try {
      // Get all assignments for this experiment
      const assignmentsSnapshot = await this.firestore
        .collection('ab_assignments')
        .where('experiment_name', '==', experimentName)
        .get();

      // Get all events for this experiment
      const eventsSnapshot = await this.firestore
        .collection('ab_events')
        .where('experiment_name', '==', experimentName)
        .get();

      // Aggregate results
      const variantCounts: Record<string, number> = {};
      const eventCounts: Record<string, Record<string, number>> = {};

      assignmentsSnapshot.forEach(doc => {
        const data = doc.data() as ABTestAssignment;
        variantCounts[data.variant] = (variantCounts[data.variant] || 0) + 1;
      });

      eventsSnapshot.forEach(doc => {
        const data = doc.data();
        const variant = data.event_data?.variant || 'unknown';
        const eventType = data.event_type;

        if (!eventCounts[variant]) {
          eventCounts[variant] = {};
        }
        eventCounts[variant][eventType] = (eventCounts[variant][eventType] || 0) + 1;
      });

      return {
        experiment_name: experimentName,
        variant_assignments: variantCounts,
        event_counts: eventCounts,
        total_users: Object.values(variantCounts).reduce((sum, count) => sum + count, 0),
        total_events: Object.values(eventCounts).reduce(
          (sum, events) => sum + Object.values(events).reduce((eSum, eCount) => eSum + eCount, 0),
          0
        )
      };
    } catch (error) {
      console.error('Error getting experiment results:', error);
      return {};
    }
  }

  private getConsistentVariant(
    userId: string,
    experimentName: string,
    variants: Record<string, number>
  ): string {
    // Create a hash from user_id and experiment_name
    const hashInput = `${userId}:${experimentName}`;
    const hash = this.simpleHash(hashInput);
    
    // Use hash to get a value between 0 and 1
    const normalizedHash = (hash % 10000) / 10000.0;
    
    // Assign variant based on cumulative probability
    let cumulative = 0.0;
    for (const [variant, probability] of Object.entries(variants)) {
      cumulative += probability;
      if (normalizedHash <= cumulative) {
        return variant;
      }
    }
    
    // Fallback to first variant
    return Object.keys(variants)[0];
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
