#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*
 *  Lab 9: Hospital ER Triage
 *  you will implement an application to manage a hospital emergency room queue
 *  based on priority and arrival order -- Patients can be added, treated, or removed
 *  Dynamically allocation required
 *
 *  Each patient has:
 *  1. an integer ID (Unique for each patient)
 *  2. Large number => higher priority
 *  3. a name with no whitespace -- Max 100 characters per name
 *  4. next: A pointer to the next node
 *  eg.) A 101 Jane 1, C 201 Mary 1
 *
 *  Rule:
 *  1. Higher severity patients come first
 *  2. If severity is the same, patients stay in arrival order
 */

/*  Queue Operations:
 *  Add Patient - Format: A <ID> <name> <severity>
        Checks if a patient with the same ID already exists
            Prints: "Error: Patient <ID> already exists." followed by a newline character and Does NOT add the new patient to the list
        If a patient with ID does not exist
            Inserts the new patient node into the linked list based on severity level and arrival order.
            Prints: Patient <ID> Added. followed by a newline character.
        NOTE: Higher severity patients are placed closer to the front/head of the queue, and patients with equal severity wait in line based on order of arrival.

 *  Treat Patient - Format: T
        If there are patients in the queue
            Removes the patient at the front of the queue (highest severity)
            Prints Patient <ID> Treated. followed by a newline character
        If no patients are in the queue
            Prints Queue is empty. followed by a newline character

 *  Remove Patient - Format: R <ID>
        Removes the patient
            Prints Patient <ID> Removed. followed by a newline character
        If the patient is not found
            Prints Error: Patient <ID> not found. followed by a newline character

 *  Display Queue - Format: D
            Displays all patients in the queue, one per line, showing their Name and Severity Level
        If the queue is empty
            Prints Queue is empty. followed by a newline character

 *  End Program - Format: Q
        frees all dynamically allocated space to avoid memory leaks
        Exits the program
 */

/* Example 1:
A 101 Jane 1
Patient 101 Added.
A 201 Mary 2
Patient 201 Added.
A 301 John 4
Patient 301 Added.
A 201 Mary 1
Error: Patient 201 already exists.
D
John 4
Mary 2
Jane 1
Q
*/

/* Example 2:
A 101 John 5
Patient 101 Added.
A 101 John 5
Error: Patient 101 already exists.
R 999 Error: Patient 999 not found.
T
Patient 101 Treated.
T Queue is empty.
D Queue is empty.
Q
*/

// Patient node
typedef struct Patient {
    int id;
    char name[100];
    int severity;
    struct Patient *next;
} Patient;

// Queue (head pointer)
typedef struct {
    Patient *head;
} Queue;

// ------------------ Helper Functions ------------------

// create new patient node
Patient* createPatient(int id, char name[], int severity) {
    Patient *newNode = (Patient*)malloc(sizeof(Patient));
    newNode -> id = id;
    strcpy(newNode -> name, name);
    newNode -> severity = severity;
    newNode -> next = NULL;
    return newNode;
}

// check if ID already exists
int idExists(Queue *line, int id) {
    Patient *current = line -> head;
    while (current != NULL) {
        if (current -> id == id) {
            return 1;
        }
        current = current -> next;
    }
    return 0;
}

// ------------------ Operations ------------------

// A command
void addPatient(Queue *line, int id, char name[], int severity) {

    if (idExists(line, id)) {
        printf("Error: Patient %d already exists.\n", id);
        return;
    }
    Patient *newNode = createPatient(id, name, severity);

    // insert at head
    if (line -> head == NULL || severity > line -> head->severity) {
        newNode->next = line -> head;
        line -> head = newNode;
    }   else    {
        Patient *current = line -> head;
        // move until correct position
        while (current -> next != NULL && current -> next ->severity >= severity) {
            current = current ->next;
        }
        newNode -> next = current -> next;
        current -> next = newNode;
    }

    printf("Patient %d Added.\n", id);
}

// T command
void treatPatient(Queue *line) {
    if (line -> head == NULL) {
        printf("Queue is empty.\n");
        return;
    }

    Patient *temp = line -> head;
    printf("Patient %d Treated.\n", temp->id);

    line -> head = line -> head -> next;
    free(temp);
}

// R command
void removePatient(Queue *line, int id) {

    if (line->head == NULL) {
        printf("Patient %d not found.\n", id);
        return;
    }

    Patient *current = line->head;
    Patient *prev = NULL;

    while (current != NULL) {
        if (current -> id == id) {

            if (prev == NULL) { // removing head
                line -> head = current -> next;
            }   else    {
                prev ->next = current -> next;
            }
            free(current);
            printf("Patient %d Removed.\n", id);
            return;
        }

        prev = current;
        current = current ->next;
    }

    printf("Error: Patient %d not found.\n", id);
}

// D command
void displayQueue(Queue *line) {

    if (line->head == NULL) {
        printf("Queue is empty.\n");
        return;
    }

    Patient *current = line -> head;

    while (current != NULL) {
        printf("%s %d\n", current ->name, current -> severity);
        current = current -> next;
    }
}

// free all memory (Q command)
void freeQueue(Queue *line) {
    Patient *current = line->head;

    while (current != NULL) {
        Patient *temp = current;
        current = current->next;
        free(temp);
    }

    line->head = NULL;
}

// ------------------ Main ------------------

int main(void) {
    Queue line;
    line.head = NULL;
    char command;
    while (1) {
        scanf(" %c", &command);
        if (command == 'A') {
            int id, severity;
            char name[100];
            scanf("%d %s %d", &id, name, &severity);
            addPatient(&line, id, name, severity);
        }   else if (command == 'T') {
            treatPatient(&line);
        }   else if (command == 'R') {
            int id;
            scanf("%d", &id);
            removePatient(&line, id);
        }   else if (command == 'D') {
            displayQueue(&line);
        }   else if (command == 'Q') {
            freeQueue(&line);
            break;
        }
    }
    return 0;
}