import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Results = ({ objectCounts }) => {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Detection Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mt-4">
            <h2 className="text-2xl">Detected Objects</h2>
            <ul>
              {Object.entries(objectCounts).map(([objectClass, count]) => (
                <li key={objectClass}>{objectClass}: {count}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Results;